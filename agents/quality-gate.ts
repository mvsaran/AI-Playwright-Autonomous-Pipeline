/**
 * Quality Gate Agent
 * Reads: execution-summary.json + failure-analysis.json + validation-report.json
 * Writes: agents/output/final-quality-gate.json + reports/final-summary.md
 */
import { readJson, writeJson, extractAndParseJson } from '../utils/json-utils';
import { readFile, writeFile, ensureDir } from '../utils/fs-utils';
import { callAI } from '../utils/openai-client';
import { logger } from '../utils/logger';
import { Paths, Thresholds, RUN_LABEL, generateId, nowIso } from '../utils/run-context';
import type { ExecutionSummary } from '../types/execution';
import type { FailureAnalysis, ValidationReport, FinalQualityGate } from '../types/failure';

const CONTEXT = 'QualityGate';

async function gate(): Promise<void> {
  logger.separator('QUALITY GATE AGENT');

  const execution = readJson<ExecutionSummary>(Paths.executionSummary());
  const failureAnalysis = readJson<FailureAnalysis>(Paths.failureAnalysis());
  const validation = readJson<ValidationReport>(Paths.validationReport());

  const systemPrompt = readFile(`${Paths.prompts}/quality-gate.prompt.md`);

  const userPrompt = `
Evaluate this pipeline run and produce a final quality gate decision.

=== EXECUTION SUMMARY ===
${JSON.stringify(execution, null, 2)}

=== FAILURE ANALYSIS ===
${JSON.stringify(failureAnalysis, null, 2)}

=== VALIDATION REPORT ===
${JSON.stringify(validation, null, 2)}

=== THRESHOLDS ===
Pass threshold: ${Thresholds.pass}%
Warn threshold: ${Thresholds.warn}%

Return ONLY the JSON quality gate object.
`.trim();

  logger.info(CONTEXT, 'Requesting AI quality gate decision...');
  const rawResponse = await callAI(systemPrompt, userPrompt, CONTEXT);
  let qualityGate = extractAndParseJson<FinalQualityGate>(rawResponse, CONTEXT);

  // Enforce computed values (do not trust AI math blindly)
  const totalTests = execution.totalTests;
  const passed = execution.passed + validation.nowPassing;
  const failed = execution.failed - validation.nowPassing;
  const passRate = totalTests > 0 ? Math.round((passed / totalTests) * 1000) / 10 : 0;
  const healed = validation.nowPassing;
  const probableAppBugs = failureAnalysis.summary?.probableAppBugs ?? 0;

  // Override computed fields
  qualityGate.gateId = qualityGate.gateId || generateId('gate');
  qualityGate.timestamp = qualityGate.timestamp || nowIso();
  qualityGate.passRate = passRate;
  qualityGate.thresholds = { pass: Thresholds.pass, warn: Thresholds.warn };
  qualityGate.metrics = {
    totalTests,
    passed,
    failed: Math.max(0, failed),
    healed,
    unresolvedFailures: Math.max(0, execution.failed - healed),
    probableAppBugs,
  };
  qualityGate.reportPath = Paths.finalSummary();

  // Re-evaluate pipeline status based on real numbers
  if (passRate >= Thresholds.pass) {
    qualityGate.pipelineStatus = probableAppBugs > 0 ? 'PASS_WITH_WARNINGS' : 'PASS';
  } else if (passRate >= Thresholds.warn) {
    qualityGate.pipelineStatus = 'PASS_WITH_WARNINGS';
  } else {
    qualityGate.pipelineStatus = 'FAIL';
  }

  ensureDir(Paths.agentsOutput);
  ensureDir(Paths.reports);
  writeJson(Paths.finalQualityGate(), qualityGate);

  // Generate human-readable markdown summary
  const markdown = buildMarkdownSummary(qualityGate, execution, validation);
  writeFile(Paths.finalSummary(), markdown);

  logger.success(CONTEXT, `Quality gate written to: ${Paths.finalQualityGate()}`);
  logger.success(CONTEXT, `Final summary written to: ${Paths.finalSummary()}`);
  logger.separator(`PIPELINE STATUS: ${qualityGate.pipelineStatus}`);
  logger.info(CONTEXT, `  → Pass Rate: ${passRate}%`);
  logger.info(CONTEXT, `  → Decision: ${qualityGate.decision}`);

  if (qualityGate.pipelineStatus === 'FAIL') {
    process.exitCode = 1;
  }
}

function buildMarkdownSummary(
  gate: FinalQualityGate,
  exec: ExecutionSummary,
  validation: ValidationReport
): string {
  const statusEmoji =
    gate.pipelineStatus === 'PASS' ? '✅' :
    gate.pipelineStatus === 'PASS_WITH_WARNINGS' ? '⚠️' : '❌';

  return `# ${statusEmoji} Pipeline Quality Gate — ${RUN_LABEL}

**Status:** \`${gate.pipelineStatus}\`
**Generated:** ${gate.timestamp}
**Pass Rate:** ${gate.passRate}%
**Thresholds:** Pass ≥ ${gate.thresholds.pass}% | Warn ≥ ${gate.thresholds.warn}%

---

## Summary

${gate.summary}

## Metrics

| Metric | Value |
|---|---|
| Total Tests | ${gate.metrics?.totalTests ?? 'N/A'} |
| Passed | ${gate.metrics?.passed ?? 'N/A'} |
| Failed | ${gate.metrics?.failed ?? 'N/A'} |
| Healed by Self-Healer | ${gate.metrics?.healed ?? 'N/A'} |
| Unresolved Failures | ${gate.metrics?.unresolvedFailures ?? 'N/A'} |
| Probable App Bugs | ${gate.metrics?.probableAppBugs ?? 'N/A'} |

## Decision

> ${gate.decision}

${gate.blockers && gate.blockers.length > 0 ? `## ❌ Blockers\n\n${gate.blockers.map((b) => `- ${b}`).join('\n')}` : ''}

${gate.warnings && gate.warnings.length > 0 ? `## ⚠️ Warnings\n\n${gate.warnings.map((w) => `- ${w}`).join('\n')}` : ''}

## Healing Summary

- Healing attempted: ${validation.totalReRun} test(s)
- Now passing after healing: ${validation.nowPassing}
- Still failing: ${validation.stillFailing}
- Healing success rate: ${validation.healingSuccessRate}%
- Validation status: \`${validation.status}\`

## Report Paths

- Playwright HTML Report: \`playwright-report/index.html\`
- Execution Summary: \`agents/output/execution-summary.json\`
- Failure Analysis: \`agents/output/failure-analysis.json\`
- Healing Report: \`agents/output/healing-action.json\`
- Quality Gate JSON: \`agents/output/final-quality-gate.json\`
`;
}

gate().catch((err) => {
  logger.error(CONTEXT, 'Quality gate failed.', err);
  process.exit(1);
});
