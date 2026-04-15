/**
 * TypeScript types for failure analysis and self-healing contracts.
 */

export type FailureType =
  | 'locator_issue'
  | 'timing_issue'
  | 'assertion_issue'
  | 'data_issue'
  | 'environment_issue'
  | 'flaky'
  | 'probable_app_bug';

export interface FailureDetail {
  testId: string;
  title: string;
  failureType: FailureType;
  errorMessage: string;
  filePath: string;
  confidence: number;
  reasoning: string;
  healable: boolean;
  suggestedFix?: string;
}

export interface FailureSummary {
  totalFailures: number;
  healableCount: number;
  probableAppBugs: number;
  byType: Record<FailureType, number>;
}

export interface FailureAnalysis {
  analysisId: string;
  timestamp: string;
  sourceExecutionId: string;
  failures: FailureDetail[];
  summary?: FailureSummary;
}

// ─── Healing ─────────────────────────────────────────────────────

export type HealingActionType =
  | 'selector_update'
  | 'timeout_increase'
  | 'wait_added'
  | 'assertion_adjusted'
  | 'skipped_low_confidence'
  | 'skipped_app_bug';

export interface HealingAction {
  testId: string;
  filePath: string;
  backupPath?: string;
  actionType: HealingActionType;
  description: string;
  before?: string;
  after?: string;
  applied: boolean;
  confidence: number;
  skipReason?: string;
}

export interface HealingSummary {
  totalAttempted: number;
  totalApplied: number;
  totalSkipped: number;
}

export interface HealingReport {
  healingId: string;
  timestamp: string;
  sourceAnalysisId: string;
  actions: HealingAction[];
  summary?: HealingSummary;
}

// ─── Validation ───────────────────────────────────────────────────

export type ValidationStatus = 'IMPROVED' | 'SAME' | 'REGRESSED';

export interface ValidationResult {
  testId: string;
  title: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  errorMessage?: string;
  healingApplied?: boolean;
}

export interface ValidationReport {
  reportId: string;
  timestamp: string;
  sourceHealingId: string;
  totalReRun: number;
  nowPassing: number;
  stillFailing: number;
  healingSuccessRate: number;
  results: ValidationResult[];
  status: ValidationStatus;
  notes?: string;
}

// ─── Quality Gate ─────────────────────────────────────────────────

export type QualityGateStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';

export interface QualityGateThresholds {
  pass: number;
  warn: number;
}

export interface QualityGateMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  healed: number;
  unresolvedFailures: number;
  probableAppBugs: number;
}

export interface FinalQualityGate {
  gateId: string;
  timestamp: string;
  pipelineStatus: QualityGateStatus;
  passRate: number;
  thresholds: QualityGateThresholds;
  decision: string;
  metrics?: QualityGateMetrics;
  summary: string;
  reportPath?: string;
  blockers?: string[];
  warnings?: string[];
}
