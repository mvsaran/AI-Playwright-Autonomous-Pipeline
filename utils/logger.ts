/**
 * Simple structured logger with timestamps and level prefixes.
 * Avoids external logger dependencies for portability.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS';

function timestamp(): string {
  return new Date().toISOString();
}

function format(level: LogLevel, context: string, message: string): string {
  return `[${timestamp()}] [${level}] [${context}] ${message}`;
}

export const logger = {
  info(context: string, message: string): void {
    console.log(format('INFO', context, message));
  },

  warn(context: string, message: string): void {
    console.warn(format('WARN', context, message));
  },

  error(context: string, message: string, err?: unknown): void {
    console.error(format('ERROR', context, message));
    if (err instanceof Error) {
      console.error(`           ${err.message}`);
      if (err.stack) console.error(`           ${err.stack}`);
    }
  },

  debug(context: string, message: string): void {
    if (process.env.DEBUG === 'true') {
      console.debug(format('DEBUG', context, message));
    }
  },

  success(context: string, message: string): void {
    console.log(format('SUCCESS', context, message));
  },

  separator(label?: string): void {
    const line = '─'.repeat(60);
    console.log(label ? `\n${line}\n  ${label}\n${line}` : line);
  },
};
