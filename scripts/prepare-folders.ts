/**
 * Prepare Folders Script
 * Ensures all required runtime directories exist before pipeline runs.
 */
import { ensureDir } from '../utils/fs-utils';
import { logger } from '../utils/logger';
import { Paths } from '../utils/run-context';

const CONTEXT = 'PrepareFolders';

function prepare(): void {
  logger.separator('PREPARE FOLDERS');

  const dirs = [
    Paths.agentsOutput,
    Paths.reports,
    Paths.artifacts,
    Paths.testsGenerated,
  ];

  for (const dir of dirs) {
    ensureDir(dir);
    logger.info(CONTEXT, `✓ ${dir}`);
  }

  logger.success(CONTEXT, 'All required directories are ready.');
}

prepare();
