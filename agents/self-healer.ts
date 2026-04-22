/**
 * Self-Healer Agent
 * Reads: agents/output/failure-analysis.json
 * Writes: agents/output/healing-action.json
 */
import * as path from 'path';
import { readJson, writeJson, extractAndParseJson } from '../utils/json-utils';
import { readFile, writeFile, backupFile, ensureDir, fileExists } from '../utils/fs-utils';
import { callAI } from '../utils/openai-client';
import { logger } from '../utils/logger';
import { Paths, generateId, nowIso } from '../utils/run-context';
import type { FailureAnalysis, FailureDetail, HealingReport, HealingAction } from '../types/failure';
import { saveHealing } from '../utils/db-utils';

const CONTEXT = 'SelfHealer';
const MIN_CONFIDENCE = 0.7;
// FIX (Bug 4): assertion_issue is a valid test-side fix per the system prompt
const HEALABLE_TYPES = new Set(['locator_issue', 'timing_issue', 'assertion_issue']);
const AUTO_HEAL = process.env.AI_AUTO_HEAL !== 'false';

async function heal(): Promise<void> {
  logger.separator('SELF-HEALER AGENT');
  
  if (!AUTO_HEAL) {
    logger.warn(CONTEXT, 'AI_AUTO_HEAL is disabled. Fixes will be staged in report but not applied to source files.');
  }

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

    if (!failure.healable || failure.failureType === 'probable_app_bug' || failure.confidence < MIN_CONFIDENCE || !HEALABLE_TYPES.has(failure.failureType)) {
      logger.info(CONTEXT, `  → Skipped: failure not suitable for auto-healing`);
      actions.push(buildSkip(failure, 'skipped_low_confidence', 'Not suitable for auto-healing or low confidence.'));
      continue;
    }

    let sourceCode: string;
    let actualPath = failure.filePath;

    // FIX (Bug 6): robust multi-prefix path resolution for Windows backslash paths
    try {
      const candidates = [
        path.resolve(process.cwd(), actualPath),
        path.resolve(process.cwd(), 'tests', actualPath),
        path.resolve(process.cwd(), 'tests', 'generated', path.basename(actualPath)),
      ];
      const found = candidates.find(fileExists);
      if (!found) throw new Error(`None of the candidate paths exist: ${candidates.join(', ')}`);
      actualPath = found;
      sourceCode = readFile(actualPath);
      failure.filePath = actualPath;
    } catch {
      logger.warn(CONTEXT, `  → Skipped: cannot read file for "${failure.title}"`);
      actions.push(buildSkip(failure, 'skipped_low_confidence', `Source file could not be read.`));
      continue;
    }

    // FIX (Bug 2): send full source code — truncation caused AI to hallucinate snippets
    const userPrompt = `
A Playwright test is failing with a ${failure.failureType}. Please suggest a precise, minimal code fix.

Failure details:
- Test: "${failure.title}"
- File: ${failure.filePath}
- Failure type: ${failure.failureType}
- Error: ${failure.errorMessage}
- Suggested fix: ${failure.suggestedFix ?? 'none'}

Full source file content:
\`\`\`typescript
${sourceCode}
\`\`\`

Return ONLY a single JSON healing action object (not an array or wrapped object).
The "before" and "after" fields must be EXACT code strings copied from the source above.
`.trim();

    try {
      const rawResponse = await callAI(systemPrompt, userPrompt, CONTEXT);
      let action = extractAndParseJson<any>(rawResponse, CONTEXT);

      if (action.actions && Array.isArray(action.actions)) action = action.actions[0];
      action.testId = failure.testId;
      action.filePath = failure.filePath;

      // FIX (Bug 1): we determine `applied` — do NOT trust the AI's own flag.
      // FIX (Bug 3): removed broken multi-line fuzzy fallback.
      // Gate: only proceed if AI gave us concrete before/after strings.
      if (action.before && action.after) {
        const freshSource = readFile(failure.filePath);

        // Strategy 1: Check if 'before' is a regex literal (e.g. /pattern/flags)
        const regexMatch = action.before.match(/^\/(.+)\/([gimuy]*)$/);

        // Strategy 2: exact substring match
        const exactMatch = freshSource.includes(action.before);

        if (!regexMatch && !exactMatch) {
          logger.warn(CONTEXT, `  → "before" snippet not found in source — skipping to protect code integrity.`);
          logger.warn(CONTEXT, `     Snippet: ${action.before.slice(0, 120).replace(/\n/g, '↵')}`);
          action.applied = false;
        } else if (AUTO_HEAL) {
          const backupPath = backupFile(failure.filePath);
          action.backupPath = backupPath;

          let healed: string;

          if (regexMatch) {
            const regex = new RegExp(regexMatch[1], regexMatch[2]);
            healed = freshSource.replace(regex, action.after);
            logger.info(CONTEXT, `  → Applied regex-based replacement.`);
          } else {
            // Exact string replacement (replace only the first occurrence)
            healed = freshSource.replace(action.before, action.after);
            logger.info(CONTEXT, `  → Applied exact string replacement.`);
          }

          writeFile(failure.filePath, healed);
          action.applied = true;
          logger.success(CONTEXT, `  → Healing applied to: ${failure.filePath}`);
        } else {
          logger.info(CONTEXT, `  → STAGED: Fix suggested but not applied (AI_AUTO_HEAL=false).`);
          action.applied = false;
          action.status = 'STAGED';
        }
      } else {
        logger.warn(CONTEXT, `  → AI did not return before/after snippets — skipping.`);
        action.applied = false;
      }

      saveHealing({
        testId: failure.testId,
        filePath: failure.filePath,
        failureType: failure.failureType,
        fixApplied: action.applied,
        timestamp: nowIso(),
        runId: analysis.analysisId,
      });

      actions.push(action);
    } catch (err) {
      logger.error(CONTEXT, `  → Healing failed for "${failure.title}"`, err);
      actions.push(buildSkip(failure, 'skipped_low_confidence', 'AI healing process failed.'));
    }
  }

  writeHealingReport(analysis.analysisId, actions);
}

// FIX (Bug 5): derive correct actionType from failure context
function buildSkip(failure: FailureDetail, _requestedType: HealingAction['actionType'], reason: string): HealingAction {
  const actionType: HealingAction['actionType'] =
    failure.failureType === 'probable_app_bug' ? 'skipped_app_bug' : 'skipped_low_confidence';
  return {
    testId: failure.testId,
    filePath: failure.filePath,
    actionType,
    description: reason,
    applied: false,
    confidence: failure.confidence,
    skipReason: reason,
  };
}

function writeHealingReport(sourceAnalysisId: string, actions: HealingAction[]): void {
  const report: HealingReport = {
    healingId: generateId('healing'),
    timestamp: nowIso(),
    sourceAnalysisId,
    actions,
    summary: {
      totalAttempted: actions.length,
      totalApplied: actions.filter((a) => a.applied).length,
      totalSkipped: actions.filter((a) => !a.applied).length,
    },
  };
  ensureDir(Paths.agentsOutput);
  writeJson(Paths.healingAction(), report);
  logger.success(CONTEXT, `Report written to: ${Paths.healingAction()}`);
}

heal().catch((err) => {
  logger.error(CONTEXT, 'Self-healing failed.', err);
  process.exit(1);
});
