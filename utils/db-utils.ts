import * as fs from 'fs';
import * as path from 'path';
import { ensureDir } from './fs-utils';
import { logger } from './logger';
import { nowIso } from './run-context';

export interface RunHistory {
  runId: string;
  label: string;
  timestamp: string;
  durationMs: number;
  passRate: number;
  status: 'PASS' | 'FAIL' | 'PASS_WITH_WARNINGS';
  healedTests: number;
  totalTests: number;
  cost: number;
}

export interface HealingHistory {
  testId: string;
  filePath: string;
  failureType: string;
  fixApplied: boolean;
  timestamp: string;
  runId: string;
}

const DB_DIR = path.resolve(process.cwd(), 'db');
const HISTORY_FILE = path.join(DB_DIR, 'run-history.json');
const HEALING_DB = path.join(DB_DIR, 'healing-memory.json');

const CONTEXT = 'Persistence';

export function saveRun(run: RunHistory): void {
  ensureDir(DB_DIR);
  let history: RunHistory[] = [];
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    } catch {
      history = [];
    }
  }
  history.push(run);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  logger.success(CONTEXT, `Run ${run.runId} saved to history.`);
}

export function saveHealing(healing: HealingHistory): void {
  ensureDir(DB_DIR);
  let memory: HealingHistory[] = [];
  if (fs.existsSync(HEALING_DB)) {
    try {
      memory = JSON.parse(fs.readFileSync(HEALING_DB, 'utf-8'));
    } catch {
      memory = [];
    }
  }
  memory.push(healing);
  fs.writeFileSync(HEALING_DB, JSON.stringify(memory, null, 2));
}

export function getHealingMemory(testId: string): HealingHistory[] {
  if (!fs.existsSync(HEALING_DB)) return [];
  try {
    const memory: HealingHistory[] = JSON.parse(fs.readFileSync(HEALING_DB, 'utf-8'));
    return memory.filter((m) => m.testId === testId);
  } catch {
    return [];
  }
}

export function getProjectSummary(): any {
  if (!fs.existsSync(HISTORY_FILE)) return null;
  try {
    const history: RunHistory[] = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    const totalRuns = history.length;
    const avgPassRate = history.reduce((acc, r) => acc + r.passRate, 0) / totalRuns;
    const totalHealed = history.reduce((acc, r) => acc + r.healedTests, 0);
    const totalCost = history.reduce((acc, r) => acc + r.cost, 0);

    return {
      totalRuns,
      avgPassRate: avgPassRate.toFixed(1),
      totalHealed,
      totalCost: totalCost.toFixed(2),
    };
  } catch {
    return null;
  }
}
