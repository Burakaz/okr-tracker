/**
 * Structured Logging Utility for OKR Tracker
 *
 * In production: outputs JSON lines for Vercel log parsing.
 * In development: outputs human-readable colored text.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('OKR created', { okrId: '123', userId: 'abc' });
 *   logger.error('Database query failed', { error: err.message, route: '/api/okrs' });
 *   logger.audit('okr.created', { userId: 'abc', resourceId: '123' });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  context?: LogContext;
}

const isProduction = process.env.NODE_ENV === 'production';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  audit: 4,
};

const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isProduction ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
}

/**
 * Redacts fields that should never appear in logs.
 */
function redactSensitive(context?: LogContext): LogContext | undefined {
  if (!context) return context;
  const redacted = { ...context };
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'apiKey', 'api_key', 'service_role_key'];
  for (const key of Object.keys(redacted)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      redacted[key] = '[REDACTED]';
    }
  }
  return redacted;
}

function formatDev(entry: LogEntry): string {
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[90m',   // gray
    info: '\x1b[36m',    // cyan
    warn: '\x1b[33m',    // yellow
    error: '\x1b[31m',   // red
    audit: '\x1b[35m',   // magenta
  };
  const reset = '\x1b[0m';
  const color = levelColors[entry.level];
  const time = new Date(entry.timestamp).toLocaleTimeString();
  const levelLabel = entry.level.toUpperCase().padEnd(5);

  let output = `${color}[${time}] ${levelLabel}${reset} ${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    const contextStr = Object.entries(entry.context)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' ');
    if (contextStr) {
      output += ` ${color}|${reset} ${contextStr}`;
    }
  }

  return output;
}

function formatProd(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function writeLog(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'okr-tracker',
    context: redactSensitive(context),
  };

  const formatted = isProduction ? formatProd(entry) : formatDev(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'debug':
      console.debug(formatted);
      break;
    default:
      console.log(formatted);
      break;
  }
}

/**
 * Generate a short request ID for tracing.
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const logger = {
  debug: (message: string, context?: LogContext) => writeLog('debug', message, context),
  info: (message: string, context?: LogContext) => writeLog('info', message, context),
  warn: (message: string, context?: LogContext) => writeLog('warn', message, context),
  error: (message: string, context?: LogContext) => writeLog('error', message, context),
  audit: (message: string, context?: LogContext) => writeLog('audit', message, context),

  /**
   * Logs an incoming API request. Returns a finish callback for timing.
   */
  request(method: string, path: string, options?: { userId?: string; requestId?: string }) {
    const requestId = options?.requestId || generateRequestId();
    const startTime = Date.now();

    writeLog('info', `${method} ${path}`, {
      requestId,
      userId: options?.userId,
      method,
      path,
    });

    return {
      requestId,
      startTime,
      /**
       * Call when the request finishes to log duration and status.
       */
      finish(statusCode: number, extra?: LogContext) {
        const durationMs = Date.now() - startTime;
        const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        const slowThreshold = 2000;

        const logContext: LogContext = {
          requestId,
          userId: options?.userId,
          method,
          path,
          statusCode,
          durationMs,
          ...extra,
        };

        writeLog(level, `${method} ${path} ${statusCode} ${durationMs}ms`, logContext);

        if (durationMs > slowThreshold) {
          writeLog('warn', `Slow request detected: ${method} ${path}`, {
            requestId,
            durationMs,
            statusCode,
            path,
            method,
          });
        }
      },
    };
  },
};
