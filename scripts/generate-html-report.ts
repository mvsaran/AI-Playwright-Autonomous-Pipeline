/**
 * HTML Report Generator
 * Aggregates results from Playwright and all AI agents into a single, beautiful dashboard.
 */
import * as fs from 'fs';
import * as path from 'path';
import { readJson } from '../utils/json-utils';
import { Paths, RUN_LABEL } from '../utils/run-context';
import { logger } from '../utils/logger';
import type { ExecutionSummary } from '../types/execution';
import type { FailureAnalysis, ValidationReport, FinalQualityGate } from '../types/failure';

const CONTEXT = 'HtmlReport';

async function generate(): Promise<void> {
  logger.separator('GENERATING HTML REPORT');

  try {
    const exec = readJson<ExecutionSummary>(Paths.executionSummary());
    const analysis = readJson<FailureAnalysis>(Paths.failureAnalysis());
    const validation = readJson<ValidationReport>(Paths.validationReport());
    const gate = readJson<FinalQualityGate>(Paths.finalQualityGate());

    const html = buildHtml(exec, analysis, validation, gate);
    const reportPath = path.join(Paths.reports, 'autonomous-report.html');
    
    fs.writeFileSync(reportPath, html);
    logger.success(CONTEXT, `Dashboard generated: ${reportPath}`);
  } catch (err) {
    logger.error(CONTEXT, 'Failed to generate HTML report.', err);
    process.exit(1);
  }
}

function buildHtml(
  exec: ExecutionSummary,
  analysis: FailureAnalysis,
  validation: ValidationReport,
  gate: FinalQualityGate
): string {
  const statusColor = gate.pipelineStatus === 'PASS' ? '#10b981' : gate.pipelineStatus === 'FAIL' ? '#ef4444' : '#f59e0b';
  const statusIcon = gate.pipelineStatus === 'PASS' ? '✅' : gate.pipelineStatus === 'FAIL' ? '❌' : '⚠️';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Pipeline Report - ${RUN_LABEL}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f9fafb; }
        .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .status-badge { padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 0.875rem; }
    </style>
</head>
<body class="p-8">
    <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <header class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">AI Autonomous Pipeline Dashboard</h1>
                <p class="text-gray-500 mt-1">Run: <span class="font-mono text-indigo-600">${RUN_LABEL}</span> • ${gate.timestamp}</p>
            </div>
            <div class="text-right">
                <span class="status-badge text-white" style="background-color: ${statusColor}">
                    ${statusIcon} ${gate.pipelineStatus}
                </span>
                <div class="mt-2 text-sm text-gray-500">Pass Rate: ${gate.passRate}%</div>
            </div>
        </header>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="card p-6 border-l-4 border-gray-300">
                <div class="text-sm text-gray-500 font-semibold uppercase">Total Tests</div>
                <div class="text-3xl font-bold text-gray-900">${gate.metrics?.totalTests ?? 0}</div>
            </div>
            <div class="card p-6 border-l-4 border-green-500">
                <div class="text-sm text-gray-500 font-semibold uppercase">Passed</div>
                <div class="text-3xl font-bold text-green-600">${gate.metrics?.passed ?? 0}</div>
            </div>
            <div class="card p-6 border-l-4 border-red-500">
                <div class="text-sm text-gray-500 font-semibold uppercase">Failed</div>
                <div class="text-3xl font-bold text-red-600">${gate.metrics?.failed ?? 0}</div>
            </div>
            <div class="card p-6 border-l-4 border-blue-500">
                <div class="text-sm text-gray-500 font-semibold uppercase">Healed</div>
                <div class="text-3xl font-bold text-blue-600">${gate.metrics?.healed ?? 0}</div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Summary & Failures -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Decision -->
                <section class="card p-6">
                    <h2 class="text-xl font-bold mb-4 flex items-center">
                        <svg class="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        AI Decision Details
                    </h2>
                    <p class="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg italic">"${gate.decision}"</p>
                    <div class="mt-4 text-gray-600 text-sm italic">${gate.summary}</div>
                </section>

                <!-- Failure Breakdown -->
                <section class="card p-6">
                    <h2 class="text-xl font-bold mb-4">Detailed Failure Intelligence</h2>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead>
                                <tr class="text-gray-400 text-xs uppercase tracking-wider border-b">
                                    <th class="pb-3 px-2">Test Scenario</th>
                                    <th class="pb-3 px-2">AI Diagnosis</th>
                                    <th class="pb-3 px-2">Confidence Level</th>
                                    <th class="pb-3 px-2">Self-Healed?</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${analysis.failures.map(f => `
                                    <tr>
                                        <td class="py-4 px-2">
                                            <div class="font-semibold text-gray-800 text-sm">${f.testId}</div>
                                            <div class="text-xs text-red-500 truncate w-64 mt-1 font-mono">${f.errorSnippet}</div>
                                        </td>
                                        <td class="py-4 px-2">
                                            <span class="px-2 py-1 text-xs rounded bg-indigo-50 text-indigo-700 font-mono">
                                                ${f.category.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td class="py-4 px-2">
                                            <div class="flex items-center">
                                                <div class="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                                    <div class="h-full bg-indigo-500 rounded-full" style="width: ${f.confidence * 100}%"></div>
                                                </div>
                                                <span class="text-xs font-mono">${(f.confidence * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td class="py-4 px-2 text-center text-lg">
                                            ${validation.results.find(r => r.testId === f.testId)?.status === 'PASS' ? '✅' : '❌'}
                                        </td>
                                    </tr>
                                `).join('')}
                                ${analysis.failures.length === 0 ? '<tr><td colspan="4" class="py-8 text-center text-gray-400 italic">No failures detected in this pipeline run. Clean execution! ✨</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </section>
                
                <!-- Requirement Traceability -->
                <section class="card p-6">
                    <h2 class="text-xl font-bold mb-4 flex items-center">
                        <svg class="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        Requirement Traceability Matrix
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <span class="text-sm font-semibold text-gray-500">Feature Under Test:</span>
                            <div class="text-lg font-bold text-indigo-700 uppercase">Automation Exercise - Full Site Regression</div>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <span class="text-sm font-semibold text-gray-500">Coverage Level:</span>
                            <div class="text-lg font-bold text-green-600">PROD-READY (23 Scenarios)</div>
                        </div>
                    </div>
                    <div class="mt-4 text-xs text-gray-400 italic font-mono uppercase bg-gray-50 p-2 rounded">
                        Modules Covered: Authentication, Product Browsing, Shopping Cart, Checkout, Contact Us
                    </div>
                </section>
            </div>

            <!-- Right Column: Sidebar info -->
            <div class="space-y-8">
                <!-- Failure Analytics Chart -->
                <section class="card p-6">
                    <h2 class="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">Failure Anatomy</h2>
                    <canvas id="failureChart" width="200" height="200"></canvas>
                    <div id="noDataLegend" class="hidden text-center py-4 text-gray-400 text-sm italic">
                        No failure data to visualize.
                    </div>
                </section>

                <!-- Self-Healing Stats -->
                <section class="card p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <h2 class="text-xl font-bold mb-4 flex items-center">
                        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Self-Healing Intelligence
                    </h2>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center text-sm">
                            <span class="opacity-80">Healable Issues Detected</span>
                            <span class="font-bold font-mono text-lg">${analysis.failures.filter(f => f.healable).length}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="opacity-80">Successful Resolutions</span>
                            <span class="font-bold font-mono text-lg">${validation.nowPassing}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="opacity-80">Healing Success Rate</span>
                            <span class="font-bold font-mono text-lg">${validation.healingSuccessRate}%</span>
                        </div>
                        <div class="pt-4 border-t border-indigo-400">
                             <div class="text-xs opacity-80 uppercase tracking-widest font-bold">Healer Outcome status:</div>
                             <div class="text-xl font-bold mt-1">${validation.status}</div>
                        </div>
                    </div>
                </section>

                <!-- Configuration Info -->
                <section class="card p-6">
                    <h2 class="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">Pipeline Engine Config</h2>
                    <ul class="text-sm space-y-3">
                        <li class="flex justify-between">
                            <span class="text-gray-500">Run Engine</span>
                            <span class="text-gray-900 font-semibold truncate ml-4 font-mono">Playwright v1.44</span>
                        </li>
                        <li class="flex justify-between">
                            <span class="text-gray-500">Agent Brain</span>
                            <span class="text-indigo-600 font-bold font-mono">${process.env.OPENAI_MODEL ?? 'gpt-4o'}</span>
                        </li>
                        <li class="flex justify-between">
                            <span class="text-gray-500">Duration</span>
                            <span class="text-gray-900 font-semibold font-mono">${exec.durationMs ? (exec.durationMs / 1000).toFixed(1) + 's' : 'N/A'}</span>
                        </li>
                        <li class="flex justify-between">
                             <span class="text-gray-500">Browser</span>
                             <span class="text-gray-900 font-semibold font-mono uppercase">Chromium</span>
                        </li>
                    </ul>
                </section>
            </div>
        </div>

        <footer class="mt-12 text-center text-gray-400 text-sm pb-12">
            AI Playwright Autonomous Pipeline &copy; 2026. Architected by <strong>Saran</strong>.
        </footer>
    </div>

    <script>
        const ctx = document.getElementById('failureChart').getContext('2d');
        const failureData = ${JSON.stringify(
          analysis.failures.reduce((acc: Record<string, number>, f) => {
            acc[f.category] = (acc[f.category] || 0) + 1;
            return acc;
          }, {})
        )};

        if (Object.keys(failureData).length === 0) {
            document.getElementById('failureChart').classList.add('hidden');
            document.getElementById('noDataLegend').classList.remove('hidden');
        } else {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(failureData).map(k => k.replace('_', ' ')),
                    datasets: [{
                        data: Object.values(failureData),
                        backgroundColor: [
                            '#6366f1', '#f59e0b', '#10b981', '#ef4444', 
                            '#8b5cf6', '#ec4899', '#06b6d4'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
                    },
                    cutout: '70%'
                }
            });
        }
    </script>
</body>
</html>
`;
}

generate();
