/**
 * Self-Healer Agent
 * Reads: agents/output/failure-analysis.json
 * Writes: agents/output/healing-action.json
 *
 * Guardrails:
 * - Only heals test-side issues (locator, timing)
 * - Never heals probable_app_bug
 * - Only applies fixes with confidence >= 0.7
 * - Backs up original file before any change
 * - Maximum 1 healing pass
 */
import { readJson, writeJson, extractAndParseJson } from '../utils/json-utils';
import { readFile, writeFile, backupFile, ensureDir } from '../utils/fs-utils';
import { callAI } from '../utils/openai-client';
import { logger } from '../utils/logger';
import { Paths, generateId, nowIso } from '../utils/run-context';
import type { FailureAnalysis, FailureDetail, HealingReport, HealingAction } from '../types/failure';

const CONTEXT = 'SelfHealer';
const MIN_CONFIDENCE = 0.7;
const HEALABLE_TYPES = new Set(['locator_issue', 'timing_issue']);

async function heal(): Promise<void> {
  logger.separator('SELF-HEALER AGENT');

  const analysis = readJson<FailureAnalysis>(Paths.failureAnalysis());

  if (analysis.failures.length === 0) {
    logger.success(CONTEXT, 'No failures to heal.');
    writeHealingReport(analysis.analysisId, []);
    return;
  }

  const systemPrompt = readFile(`${Paths.prompts}/self-healer.prompt.md`);
  const actions: HealingAction[] = [];

  for (const failure of analysis.failures) {
    logger.info(CONTEXT, `Processing: "${failure.title}" [${failure.failureType}]`);

    // Skip if not healable per analysis
    if (!failure.healable) {
      logger.info(CONTEXT, `  → Skipped: marked not healable`);
      actions.push(buildSkip(failure, 'skipped_app_bug', 'Failure analyzer marked this as not healable.'));
      continue;
    }

    // Skip if probable_app_bug regardless
    if (failure.failureType === 'probable_app_bug') {
      logger.warn(CONTEXT, `  → Skipped: probable_app_bug — not healing app-side issues`);
      actions.push(buildSkip(failure, 'skipped_app_bug', 'Will not heal probable application bugs.'));
      continue;
    }

    // Skip if confidence too low
    if (failure.confidence < MIN_CONFIDENCE) {
      logger.warn(CONTEXT, `  → Skipped: confidence ${failure.confidence} < ${MIN_CONFIDENCE}`);
      actions.push(buildSkip(failure, 'skipped_low_confidence', `Confidence ${failure.confidence} below threshold.`));
      continue;
    }

    // Skip if not a safe healable type
    if (!HEALABLE_TYPES.has(failure.failureType)) {
      logger.info(CONTEXT, `  → Skipped: ${failure.failureType} — not in safe healing set`);
      actions.push(buildSkip(failure, 'skipped_low_confidence', `Failure type "${failure.failureType}" is not auto-healed.`));
      continue;
    }

    // Try to read the source file
    let sourceCode: string;
    try {
      sourceCode = readFile(failure.filePath);
    } catch {
      logger.warn(CONTEXT, `  → Skipped: cannot read file ${failure.filePath}`);
      actions.push(buildSkip(failure, 'skipped_low_confidence', 'Source file could not be read.'));
      continue;
    }

    // Ask AI for a specific safe fix
    const userPrompt = `
A Playwright test is failing with a ${failure.failureType}. Please suggest a precise, minimal code fix.

Failure details:
- Test: "${failure.title}"
- File: ${failure.filePath}
- Failure type: ${failure.failureType}
- Error: ${failure.errorMessage}
- Suggested fix from analysis: ${failure.suggestedFix ?? 'none'}
- Confidence: ${failure.confidence}

Source file content:
\`\`\`typescript
${sourceCode.slice(0, 3000)}
\`\`\`

Return ONLY a JSON healing action object with fields:
testId, filePath, actionType, description, before (exact code string to replace), after (replacement code string), applied, confidence.
`.trim();

    try {
      const rawResponse = await callAI(systemPrompt, userPrompt, CONTEXT);
      const action = extractAndParseJson<HealingAction>(rawResponse, CONTEXT);

      action.testId = failure.testId;
      action.filePath = failure.filePath;

      // Apply the fix if before/after are present and meaningful
      if (action.applied && action.before && action.after && action.before !== action.after) {
        if (!sourceCode.includes(action.before)) {
          logger.warn(CONTEXT, `  → "before" snippet not found in file — skipping`);
          action.applied = false;
          action.skipReason = '"before" snippet not found in source file.';
        } else {
          // Backup original
          const backupPath = backupFile(failure.filePath);
          action.backupPath = backupPath;
          logger.info(CONTEXT, `  → Backed up to: ${backupPath}`);

          // Apply the fix
          const healed = sourceCode.replace(action.before, action.after);
          writeFile(failure.filePath, healed);
          logger.success(CONTEXT, `  → Healing applied to: ${failure.filePath}`);
        }
      } else if (!action.before || !action.after) {
        action.applied = false;
        action.skipReason = 'AI did not provide valid before/after code snippets.';
        logger.warn(CONTEXT, `  → Skipped: no valid code fix provided`);
      }

      actions.push(action);
    } catch (err) {
      logger.error(CONTEXT, `  → Healing call failed for "${failure.title}"`, err);
      actions.push(buildSkip(failure, 'skipped_low_confidence', `AI healing call failed: ${(err as Error).message}`));
    }
  }

  writeHealingReport(analysis.analysisId, actions);
}

function buildSkip(
  failure: FailureDetail,
  actionType: HealingAction['actionType'],
  skipReason: string
): HealingAction {
  return {
    testId: failure.testId,
    filePath: failure.filePath,
    actionType,
    description: skipReason,
    applied: false,
    confidence: failure.confidence,
    skipReason,
  };
}

function writeHealingReport(sourceAnalysisId: string, actions: HealingAction[]): void {
  const totalApplied = actions.filter((a) => a.applied).length;
  const totalSkipped = actions.filter((a) => !a.applied).length;

  const report: HealingReport = {
    healingId: generateId('healing'),
    timestamp: nowIso(),
    sourceAnalysisId,
    actions,
    summary: {
      totalAttempted: actions.length,
      totalApplied,
      totalSkipped,
    },
  };

  ensureDir(Paths.agentsOutput);
  writeJson(Paths.healingAction(), report);

  logger.success(CONTEXT, `Healing report written to: ${Paths.healingAction()}`);
  logger.info(CONTEXT, `  → Attempted: ${actions.length} | Applied: ${totalApplied} | Skipped: ${totalSkipped}`);
}

heal().catch((err) => {
  logger.error(CONTEXT, 'Self-healing failed.', err);
  process.exit(1);
});
