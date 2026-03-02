import type { LoggerService } from '@nestjs/common';

import { writeStructuredLog } from './structured-logger';

describe('writeStructuredLog', () => {
  const logger: Pick<LoggerService, 'log' | 'warn' | 'error'> = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes JSON logs with required default fields', () => {
    writeStructuredLog(logger, 'log', {
      service: 'platform-api',
      event: 'api.bootstrap.listen'
    });

    expect(logger.log).toHaveBeenCalledTimes(1);
    const rawPayload = (logger.log as jest.Mock).mock.calls[0][0] as string;
    const payload = JSON.parse(rawPayload) as Record<string, unknown>;

    expect(payload.service).toBe('platform-api');
    expect(payload.event).toBe('api.bootstrap.listen');
    expect(payload.level).toBe('log');
    expect(payload.tenantId).toBeNull();
    expect(payload.jobId).toBeNull();
    expect(payload.correlationId).toBeNull();
    expect(payload.error).toBeNull();
    expect(payload.metadata).toEqual({});
    expect(typeof payload.timestamp).toBe('string');
  });

  it('writes warn logs preserving contextual identifiers', () => {
    writeStructuredLog(logger, 'warn', {
      service: 'platform-worker',
      event: 'worker.job.skipped',
      tenantId: 'tenant-a',
      jobId: 'job-1',
      correlationId: 'corr-1',
      metadata: {
        reason: 'duplicate'
      }
    });

    expect(logger.warn).toHaveBeenCalledTimes(1);
    const rawPayload = (logger.warn as jest.Mock).mock.calls[0][0] as string;
    const payload = JSON.parse(rawPayload) as Record<string, unknown>;

    expect(payload.tenantId).toBe('tenant-a');
    expect(payload.jobId).toBe('job-1');
    expect(payload.correlationId).toBe('corr-1');
    expect(payload.metadata).toEqual({ reason: 'duplicate' });
  });

  it('normalizes Error instances on error logs', () => {
    writeStructuredLog(logger, 'error', {
      service: 'platform-worker',
      event: 'worker.rabbitmq.topology.failed',
      error: new Error('RabbitMQ unavailable')
    });

    expect(logger.error).toHaveBeenCalledTimes(1);
    const rawPayload = (logger.error as jest.Mock).mock.calls[0][0] as string;
    const payload = JSON.parse(rawPayload) as Record<string, unknown>;
    const error = payload.error as Record<string, unknown>;

    expect(error.name).toBe('Error');
    expect(error.message).toBe('RabbitMQ unavailable');
    expect(typeof error.stack).toBe('string');
  });

  it('preserves falsy primitive error values', () => {
    writeStructuredLog(logger, 'error', {
      service: 'platform-worker',
      event: 'worker.failure.empty',
      error: ''
    });
    writeStructuredLog(logger, 'error', {
      service: 'platform-worker',
      event: 'worker.failure.zero',
      error: 0
    });
    writeStructuredLog(logger, 'error', {
      service: 'platform-worker',
      event: 'worker.failure.false',
      error: false
    });

    const first = JSON.parse((logger.error as jest.Mock).mock.calls[0][0] as string) as Record<
      string,
      unknown
    >;
    const second = JSON.parse((logger.error as jest.Mock).mock.calls[1][0] as string) as Record<
      string,
      unknown
    >;
    const third = JSON.parse((logger.error as jest.Mock).mock.calls[2][0] as string) as Record<
      string,
      unknown
    >;

    expect(first.error).toBe('');
    expect(second.error).toBe(0);
    expect(third.error).toBe(false);
  });
});
