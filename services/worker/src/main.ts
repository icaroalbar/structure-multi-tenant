import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { startOpenTelemetry } from '../../shared/observability/open-telemetry';
import { createWorkerRmqOptions } from './infrastructure/messaging/rabbitmq-options.factory';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const telemetry = startOpenTelemetry({
    serviceName: 'platform-worker',
    defaultMetricsPort: 9465
  });

  const app = await NestFactory.createMicroservice(WorkerModule, createWorkerRmqOptions());
  await app.listen();
  Logger.log('Worker connected to RabbitMQ', 'Worker');

  const shutdownTelemetry = async (): Promise<void> => {
    await telemetry.shutdown();
    Logger.log('OpenTelemetry SDK stopped', 'Worker');
  };

  process.once('SIGINT', () => {
    void shutdownTelemetry();
  });
  process.once('SIGTERM', () => {
    void shutdownTelemetry();
  });
}

void bootstrap();
