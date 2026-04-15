/**
 * JSON utilities — safe parsing, writing, and extraction from AI responses.
 */
import { writeFile, readFile } from './fs-utils';

/**
 * Safely parses a JSON string. Throws with a clear message on failure.
 */
export function parseJson<T>(raw: string, label = 'unknown'): T {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`Failed to parse JSON [${label}]: ${(err as Error).message}`);
  }
}

/**
 * Writes an object as formatted JSON to a file.
 */
export function writeJson(filePath: string, data: unknown): void {
  writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Reads and parses a JSON file.
 */
export function readJson<T>(filePath: string): T {
  const raw = readFile(filePath);
  return parseJson<T>(raw, filePath);
}

/**
 * Extracts the first JSON object or array from a string that may contain
 * markdown code fences or extra prose (typical AI responses).
 */
export function extractJson(text: string): string {
  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find first { or [ and matching close
  const start = text.search(/[{[]/);
  if (start === -1) throw new Error('No JSON object or array found in response.');

  const openChar = text[start];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let end = -1;

  for (let i = start; i < text.length; i++) {
    if (text[i] === openChar) depth++;
    if (text[i] === closeChar) depth--;
    if (depth === 0) { end = i; break; }
  }

  if (end === -1) throw new Error('Malformed JSON in response — unmatched brackets.');
  return text.slice(start, end + 1);
}

/**
 * Extracts and parses JSON from an AI response string.
 */
export function extractAndParseJson<T>(text: string, label = 'AI response'): T {
  const raw = extractJson(text);
  return parseJson<T>(raw, label);
}
