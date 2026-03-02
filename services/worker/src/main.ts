import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { startOpenTelemetry } from '../../shared/observability/open-telemetry';
import { writeStructuredLog } from '../../shared/observability/structured-logger';
import { createWorkerRmqOptions } from './infrastructure/messaging/rabbitmq-options.factory';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Worker');
  const telemetry = startOpenTelemetry({
    serviceName: 'platform-worker',
    defaultMetricsPort: 9465
  });

  const app = await NestFactory.createMicroservice(WorkerModule, createWorkerRmqOptions());
  await app.listen();
  writeStructuredLog(logger, 'log', {
    service: 'platform-worker',
    event: 'worker.bootstrap.listen'
  });

  const shutdownTelemetry = async (): Promise<void> => {
    await telemetry.shutdown();
    writeStructuredLog(logger, 'log', {
      service: 'platform-worker',
      event: 'worker.telemetry.shutdown'
    });
  };

  process.once('SIGINT', () => {
    void shutdownTelemetry();
  });
  process.once('SIGTERM', () => {
    void shutdownTelemetry();
  });
}

void bootstrap().catch(error => {
  const logger = new Logger('Worker');
  writeStructuredLog(logger, 'error', {
    service: 'platform-worker',
    event: 'worker.bootstrap.error',
    error
  });
  process.exit(1);
});
