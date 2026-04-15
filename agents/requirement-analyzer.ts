/**
 * Requirement Analyzer Agent
 * Reads: requirements/feature.md
 * Writes: agents/output/requirement-analysis.json
 */
import { readFile } from '../utils/fs-utils';
import { writeJson } from '../utils/json-utils';
import { callAI } from '../utils/openai-client';
import { logger } from '../utils/logger';
import { Paths, generateId, nowIso } from '../utils/run-context';
import { extractAndParseJson } from '../utils/json-utils';
import { ensureDir } from '../utils/fs-utils';
import type { RequirementAnalysis } from '../types/pipeline';

const CONTEXT = 'RequirementAnalyzer';

async function loadSystemPrompt(): Promise<string> {
  return readFile(`${Paths.prompts}/requirement-analyzer.prompt.md`);
}

async function loadRequirements(): Promise<string> {
  logger.info(CONTEXT, `Reading requirements from: ${Paths.requirements}`);
  return readFile(Paths.requirements);
}

async function analyze(): Promise<void> {
  logger.separator('REQUIREMENT ANALYZER AGENT');

  const systemPrompt = await loadSystemPrompt();
  const requirementText = await loadRequirements();

  const userPrompt = `
Please analyze the following software feature requirements and produce a structured requirement analysis JSON.

=== REQUIREMENTS START ===
${requirementText}
=== REQUIREMENTS END ===

Generate a unique analysisId, use the current timestamp, and return ONLY the JSON object.
`.trim();

  logger.info(CONTEXT, 'Sending requirements to AI for analysis...');
  const rawResponse = await callAI(systemPrompt, userPrompt, CONTEXT);

  logger.debug(CONTEXT, `Raw AI response length: ${rawResponse.length} chars`);

  const analysis = extractAndParseJson<RequirementAnalysis>(rawResponse, CONTEXT);

  // Ensure id and timestamp are set (AI may omit them)
  if (!analysis.analysisId) analysis.analysisId = generateId('req-analysis');
  if (!analysis.timestamp) analysis.timestamp = nowIso();

  const outputPath = Paths.requirementAnalysis();
  ensureDir(Paths.agentsOutput);
  writeJson(outputPath, analysis);

  logger.success(CONTEXT, `Requirement analysis written to: ${outputPath}`);
  logger.info(CONTEXT, `  → Feature Summary: ${analysis.featureSummary?.slice(0, 80)}...`);
  logger.info(CONTEXT, `  → Scope: ${analysis.scope?.length ?? 0} modules`);
  logger.info(CONTEXT, `  → User Journeys: ${analysis.userJourneys?.length ?? 0}`);
  logger.info(CONTEXT, `  → Edge Cases: ${analysis.edgeCases?.length ?? 0}`);
  logger.info(CONTEXT, `  → Negative Scenarios: ${analysis.negativeScenarios?.length ?? 0}`);
  logger.info(CONTEXT, `  → Confidence Score: ${analysis.confidenceScore ?? 'N/A'}`);
}

analyze().catch((err) => {
  logger.error(CONTEXT, 'Requirement analysis failed.', err);
  process.exit(1);
});
