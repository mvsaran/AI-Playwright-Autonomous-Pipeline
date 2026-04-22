/**
 * Validator Agent
 * Reads: agents/output/healing-action.json
 * Re-runs healed tests, writes: agents/output/validation-report.json
 */
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { readJson, writeJson, extractAndParseJson } from '../utils/json-utils';
import { readFile, ensureDir } from '../utils/fs-utils';
import { callAI } from '../utils/openai-client';
import { logger } from '../utils/logger';
import { Paths, generateId, nowIso } from '../utils/run-context';
import type { HealingReport } from '../types/failure';
import type { ValidationReport, ValidationResult } from '../types/failure';

const CONTEXT = 'Validator';

async function validate(): Promise<void> {
  logger.separator('VALIDATOR AGENT');

  const healingReport = readJson<HealingReport>(Paths.healingAction());

  const appliedActions = healingReport.actions.filter((a) => a.applied);

  if (appliedActions.length === 0) {
    logger.info(CONTEXT, 'No healing was applied — skipping re-run, producing pass-through report.');

    const report: ValidationReport = {
      reportId: generateId('validation'),
      timestamp: nowIso(),
      sourceHealingId: healingReport.healingId,
      totalReRun: 0,
      nowPassing: 0,
      stillFailing: 0,
      healingSuccessRate: 0,
      results: [],
      status: 'SAME',
      notes: 'No healing actions were applied — no re-run needed.',
    };

    ensureDir(Paths.agentsOutput);
    writeJson(Paths.validationReport(), report);
    logger.success(CONTEXT, `Validation report written to: ${Paths.validationReport()}`);
    return;
  }

  // Get unique files that were healed and normalize them for Playwright CLI
  const healedFiles = [...new Set(appliedActions.map((a) => a.filePath))]
    .map(f => f.replace(/\\/g, '/')) // Normalize to forward slashes
    .filter(f => {
      const exists = fs.existsSync(f);
      if (!exists) logger.warn(CONTEXT, `  ⚠ Healed file not found at: ${f}`);
      return exists;
    });

  if (healedFiles.length === 0) {
    logger.error(CONTEXT, 'No valid healed files found to re-run. Check paths in healing-action.json.');
    // Produce a failure report
    const report: ValidationReport = {
      reportId: generateId('validation'),
      timestamp: nowIso(),
      sourceHealingId: healingReport.healingId,
      totalReRun: 0,
      nowPassing: 0,
      stillFailing: 0,
      healingSuccessRate: 0,
      results: [],
      status: 'SAME',
      notes: 'Healed files were reported but could not be found on disk.',
    };
    writeJson(Paths.validationReport(), report);
    return;
  }

  logger.info(CONTEXT, `Re-running ${healedFiles.length} healed file(s): ${healedFiles.join(', ')}`);

  const reRunReportPath = path.join(Paths.reports, 'validation-results.json').replace(/\\/g, '/');

  const result = spawnSync(
    'npx',
    ['playwright', 'test', ...healedFiles, '--reporter=json'],
    {
      encoding: 'utf-8',
      shell: true,
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: reRunReportPath },
    }
  );


  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  // Build validation results
  const validationResults: ValidationResult[] = [];
  let nowPassing = 0;
  let stillFailing = 0;

  if (fs.existsSync(reRunReportPath)) {
    try {
      const pwResult = readJson<any>(reRunReportPath);
      
      const collectSpecs = (suites: any[], parentFile: string = '') => {
        for (const suite of suites) {
          const currentFile = suite.file || parentFile;
          if (suite.suites) collectSpecs(suite.suites, currentFile);
          for (const spec of suite.specs ?? []) {
            const specFile = spec.file || currentFile;
            const fullId = specFile ? `${specFile}::${spec.title}` : spec.title;
            const wasHealed = appliedActions.some((a) => a.testId.includes(spec.title) || a.testId === fullId);
            const status = spec.ok ? 'PASS' : 'FAIL';

            if (status === 'PASS') nowPassing++;
            else stillFailing++;

            validationResults.push({
              testId: fullId,
              title: spec.title,
              status,
              healingApplied: wasHealed,
            });
          }
        }
      };


      if (pwResult.suites) {
        collectSpecs(pwResult.suites);
      }
    } catch (err) {
      logger.warn(CONTEXT, `Could not parse re-run results: ${(err as Error).message} — using exit code fallback.`);
      const status = result.status === 0 ? 'PASS' : 'FAIL';
      if (status === 'PASS') nowPassing = appliedActions.length;
      else stillFailing = appliedActions.length;
    }
  }


  const totalReRun = nowPassing + stillFailing;
  const healingSuccessRate = totalReRun > 0
    ? Math.round((nowPassing / totalReRun) * 1000) / 10
    : 0;

  const validationStatus: ValidationReport['status'] =
    nowPassing > stillFailing ? 'IMPROVED' :
    nowPassing === stillFailing ? 'SAME' : 'REGRESSED';

  const report: ValidationReport = {
    reportId: generateId('validation'),
    timestamp: nowIso(),
    sourceHealingId: healingReport.healingId,
    totalReRun,
    nowPassing,
    stillFailing,
    healingSuccessRate,
    results: validationResults,
    status: validationStatus,
    notes: `${appliedActions.length} healing action(s) applied. ${nowPassing}/${totalReRun} tests now passing.`,
  };

  ensureDir(Paths.agentsOutput);
  writeJson(Paths.validationReport(), report);

  logger.success(CONTEXT, `Validation report written to: ${Paths.validationReport()}`);
  logger.info(CONTEXT, `  → Re-run: ${totalReRun} | Now Passing: ${nowPassing} | Still Failing: ${stillFailing}`);
  logger.info(CONTEXT, `  → Healing Success Rate: ${healingSuccessRate}% | Status: ${validationStatus}`);
}

validate().catch((err) => {
  logger.error(CONTEXT, 'Validation failed.', err);
  process.exit(1);
});
