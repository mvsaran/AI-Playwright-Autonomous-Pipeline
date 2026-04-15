/**
 * Shared TypeScript types mirroring the JSON contract schemas.
 * These are used across all agents and scripts.
 */

// ─── Requirement Analysis ────────────────────────────────────────

export interface UserJourney {
  id: string;
  title: string;
  steps: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface Priorities {
  high: string[];
  medium: string[];
  low: string[];
}

export interface RequirementAnalysis {
  analysisId: string;
  timestamp: string;
  featureSummary: string;
  scope: string[];
  assumptions: string[];
  risks: string[];
  userJourneys: UserJourney[];
  edgeCases: string[];
  negativeScenarios: string[];
  priorities: Priorities;
  confidenceScore?: number;
}

// ─── Test Plan ───────────────────────────────────────────────────

export type TestModule = 'auth' | 'products' | 'cart' | 'contact' | 'home';
export type TestType = 'smoke' | 'regression' | 'negative' | 'edge';
export type Priority = 'high' | 'medium' | 'low';

export interface TestScenario {
  scenarioId: string;
  title: string;
  priority: Priority;
  module: TestModule;
  testType: TestType;
  preconditions: string[];
  steps: string[];
  expectedOutcome: string;
  tags?: string[];
}

export interface TestPlan {
  planId: string;
  timestamp: string;
  sourceAnalysisId: string;
  scenarios: TestScenario[];
  totalScenarios: number;
  coverageNotes?: string;
}

// ─── Generated Test Metadata ─────────────────────────────────────

export interface GeneratedFile {
  filePath: string;
  scenarioIds: string[];
  module: string;
  testCount?: number;
  generatedBy?: string;
  notes?: string;
}

export interface GeneratedTestMetadata {
  metadataId: string;
  timestamp: string;
  sourcePlanId: string;
  generatedFiles: GeneratedFile[];
  totalTestsGenerated: number;
  strategy?: string;
}
