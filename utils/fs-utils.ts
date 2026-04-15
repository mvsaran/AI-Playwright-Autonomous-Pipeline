/**
 * File system utilities — cross-platform path helpers and safe read/write wrappers.
 */
import * as fs from 'fs';
import * as path from 'path';

/**
 * Ensures a directory (and any missing parents) exist.
 */
export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Writes content to a file, creating parent directories if needed.
 */
export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Reads a file and returns its content as a string.
 * Throws a descriptive error if the file doesn't exist.
 */
export function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Returns true if the file exists.
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Creates a timestamped backup of a file next to the original.
 * Returns the backup path.
 */
export function backupFile(filePath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const ext = path.extname(filePath);
  const base = filePath.slice(0, filePath.length - ext.length);
  const backupPath = `${base}.backup-${timestamp}${ext}`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

/**
 * Lists all files in a directory matching an optional extension filter.
 */
export function listFiles(dirPath: string, ext?: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => (ext ? f.endsWith(ext) : true))
    .map((f) => path.join(dirPath, f));
}

/**
 * Resolves a path relative to the project root (process.cwd()).
 */
export function fromRoot(...segments: string[]): string {
  return path.resolve(process.cwd(), ...segments);
}
