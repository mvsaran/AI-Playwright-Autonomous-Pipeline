/**
 * TypeScript types for test execution results.
 */

export interface FailedTest {
  testId: string;
  title: string;
  errorMessage: string;
  filePath: string;
  screenshotPath?: string;
  tracePath?: string;
}

export type ExecutionStatus = 'PASS' | 'FAIL' | 'PARTIAL';

export interface ExecutionSummary {
  executionId: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  durationMs: number;
  reportPath: string;
  artifactPaths?: string[];
  failedTests: FailedTest[];
  status: ExecutionStatus;
}
