/**
 * Bootstrap Script
 * One-time setup: copies .env.example to .env if .env does not exist.
 * Run this once after cloning: npm run ai:bootstrap
 */
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

const CONTEXT = 'Bootstrap';

function bootstrap(): void {
  logger.separator('BOOTSTRAP');

  const envPath = path.resolve(process.cwd(), '.env');
  const envExamplePath = path.resolve(process.cwd(), '.env.example');

  if (fs.existsSync(envPath)) {
    logger.info(CONTEXT, '.env file already exists — skipping copy.');
  } else if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    logger.success(CONTEXT, '.env created from .env.example');
    logger.warn(CONTEXT, '⚠ Please open .env and set your OPENAI_API_KEY before running the pipeline.');
  } else {
    logger.error(CONTEXT, '.env.example not found — cannot bootstrap.');
    process.exit(1);
  }

  logger.info(CONTEXT, '');
  logger.info(CONTEXT, 'Next steps:');
  logger.info(CONTEXT, '  1. Set OPENAI_API_KEY in .env');
  logger.info(CONTEXT, '  2. Run: npm install');
  logger.info(CONTEXT, '  3. Run: npx playwright install chromium');
  logger.info(CONTEXT, '  4. Run: npm run ai:pipeline');
  logger.info(CONTEXT, '');
  logger.success(CONTEXT, 'Bootstrap complete.');
}

bootstrap();
