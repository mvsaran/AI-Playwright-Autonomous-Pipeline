import * as fs from 'fs';
import * as path from 'path';
import { Paths, RUN_LABEL, nowIso } from './run-context';
import { ensureDir } from './fs-utils';

export interface UsageStats {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_estimate: number;
}

const COST_PER_1M_PROMPT = 5.0; // $5.00 for gpt-4o
const COST_PER_1M_COMPLETION = 15.0; // $15.00 for gpt-4o

export function trackUsage(context: string, usage: any): void {
  if (!usage) return;

  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || 0;
  
  const cost = (promptTokens / 1_000_000) * COST_PER_1M_PROMPT + 
               (completionTokens / 1_000_000) * COST_PER_1M_COMPLETION;

  const usageFile = path.join(Paths.agentsOutput, 'total-usage.json');
  ensureDir(Paths.agentsOutput);

  let totalUsage: Record<string, UsageStats & { timestamp: string }> = {};
  if (fs.existsSync(usageFile)) {
    try {
      totalUsage = JSON.parse(fs.readFileSync(usageFile, 'utf-8'));
    } catch {
      totalUsage = {};
    }
  }

  totalUsage[context] = {
    prompt_tokens: (totalUsage[context]?.prompt_tokens || 0) + promptTokens,
    completion_tokens: (totalUsage[context]?.completion_tokens || 0) + completionTokens,
    total_tokens: (totalUsage[context]?.total_tokens || 0) + totalTokens,
    cost_estimate: (totalUsage[context]?.cost_estimate || 0) + cost,
    timestamp: nowIso(),
  };

  fs.writeFileSync(usageFile, JSON.stringify(totalUsage, null, 2));
}

export function getGlobalUsage(): UsageStats {
  const usageFile = path.join(Paths.agentsOutput, 'total-usage.json');
  if (!fs.existsSync(usageFile)) return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost_estimate: 0 };

  try {
    const data = JSON.parse(fs.readFileSync(usageFile, 'utf-8'));
    return Object.values(data).reduce(
      (acc: UsageStats, curr: any) => ({
        prompt_tokens: acc.prompt_tokens + curr.prompt_tokens,
        completion_tokens: acc.completion_tokens + curr.completion_tokens,
        total_tokens: acc.total_tokens + curr.total_tokens,
        cost_estimate: acc.cost_estimate + curr.cost_estimate,
      }),
      { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost_estimate: 0 }
    );
  } catch {
    return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost_estimate: 0 };
  }
}
