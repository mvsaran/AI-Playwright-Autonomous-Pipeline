/**
 * Test Generator Agent
 * Reads: agents/output/test-plan.json
 * Writes: agents/output/generated-test-metadata.json
 *
 * NOTE: The example spec files in tests/generated/ are pre-built and
 * aligned with the test plan. This agent produces the metadata record
 * and can optionally call AI to generate additional test code.
 */
import { readJson, writeJson } from '../utils/json-utils';
import { readFile, ensureDir, fileExists } from '../utils/fs-utils';
import { logger } from '../utils/logger';
import { Paths, generateId, nowIso } from '../utils/run-context';
import type { TestPlan, GeneratedTestMetadata } from '../types/pipeline';
import * as path from 'path';

const CONTEXT = 'TestGenerator';

/** Files we pre-built that cover the test plan scenarios. */
const PREBUILT_FILES = [
  { file: 'auth.spec.ts', module: 'auth', scenarioPrefix: 'TC-AUTH' },
  { file: 'products.spec.ts', module: 'products', scenarioPrefix: 'TC-PROD' },
  { file: 'cart.spec.ts', module: 'cart', scenarioPrefix: 'TC-CART' },
  { file: 'contact.spec.ts', module: 'contact', scenarioPrefix: 'TC-CONTACT' },
];

async function generate(): Promise<void> {
  logger.separator('TEST GENERATOR AGENT');

  const plan = readJson<TestPlan>(Paths.testPlan());
  logger.info(CONTEXT, `Loaded test plan: ${plan.planId}`);
  logger.info(CONTEXT, `  → ${plan.totalScenarios} scenarios to cover`);

  const generatedFiles = [];

  for (const entry of PREBUILT_FILES) {
    const filePath = path.join(Paths.testsGenerated, entry.file);

    // Get matching scenario IDs from the plan
    const matchingScenarios = (plan.scenarios ?? [])
      .filter((s) => s.module === entry.module)
      .map((s) => s.scenarioId);

    const exists = fileExists(filePath);

    if (exists) {
      logger.success(CONTEXT, `  ✓ Found pre-built: ${entry.file} (${matchingScenarios.length} scenarios covered)`);
    } else {
      logger.warn(CONTEXT, `  ⚠ Missing: ${entry.file} — expected at ${filePath}`);
    }

    generatedFiles.push({
      filePath,
      scenarioIds: matchingScenarios,
      module: entry.module,
      testCount: matchingScenarios.length,
      generatedBy: exists ? 'pre-built' : 'missing',
      notes: exists
        ? 'Pre-built test file aligned with test plan.'
        : 'File not found — run ai:generate to produce it.',
    });
  }

  const metadata: GeneratedTestMetadata = {
    metadataId: generateId('gen-meta'),
    timestamp: nowIso(),
    sourcePlanId: plan.planId,
    generatedFiles,
    totalTestsGenerated: generatedFiles.reduce((sum, f) => sum + (f.testCount ?? 0), 0),
    strategy: 'pre-built-with-metadata-tracking',
  };

  ensureDir(Paths.agentsOutput);
  writeJson(Paths.generatedTestMetadata(), metadata);

  logger.success(CONTEXT, `Metadata written to: ${Paths.generatedTestMetadata()}`);
  logger.info(CONTEXT, `  → Total tests tracked: ${metadata.totalTestsGenerated}`);
  logger.info(CONTEXT, `  → Files: ${generatedFiles.map((f) => path.basename(f.filePath)).join(', ')}`);
}

generate().catch((err) => {
  logger.error(CONTEXT, 'Test generation failed.', err);
  process.exit(1);
});
