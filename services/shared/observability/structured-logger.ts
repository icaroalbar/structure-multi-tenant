import type { LoggerService } from '@nestjs/common';

export type StructuredLogLevel = 'log' | 'warn' | 'error';

export interface StructuredLogInput {
  service: string;
  event: string;
  tenantId?: string | null;
  jobId?: string | null;
  correlationId?: string | null;
  error?: unknown;
  metadata?: Record<string, unknown>;
}

interface StructuredLogRecord {
  timestamp: string;
  level: StructuredLogLevel;
  service: string;
  event: string;
  tenantId: string | null;
  jobId: string | null;
  correlationId: string | null;
  error: unknown;
  metadata: Record<string, unknown>;
}

function normalizeError(error: unknown): unknown {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null
    };
  }

  return error;
}

function createStructuredRecord(
  level: StructuredLogLevel,
  input: StructuredLogInput
): StructuredLogRecord {
  return {
    timestamp: new Date().toISOString(),
    level,
    service: input.service,
    event: input.event,
    tenantId: input.tenantId ?? null,
    jobId: input.jobId ?? null,
    correlationId: input.correlationId ?? null,
    error: normalizeError(input.error),
    metadata: input.metadata ?? {}
  };
}

export function writeStructuredLog(
  logger: Pick<LoggerService, 'log' | 'warn' | 'error'>,
  level: StructuredLogLevel,
  input: StructuredLogInput
): void {
  const payload = JSON.stringify(createStructuredRecord(level, input));

  if (level === 'error') {
    logger.error(payload);
    return;
  }

  if (level === 'warn') {
    logger.warn(payload);
    return;
  }

  logger.log(payload);
}
