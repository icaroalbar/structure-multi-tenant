import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { startOpenTelemetry } from '../../shared/observability/open-telemetry';
import { AppModule } from './app.module';
import { loadJwtRuntimeConfig } from './infrastructure/auth/jwt-config';

async function bootstrap(): Promise<void> {
  const telemetry = startOpenTelemetry({
    serviceName: 'platform-api',
    defaultMetricsPort: 9464
  });

  loadJwtRuntimeConfig();
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3000);

  await app.listen(port);
  Logger.log(`API started on port ${port}`, 'API');

  const shutdownTelemetry = async (): Promise<void> => {
    await telemetry.shutdown();
    Logger.log('OpenTelemetry SDK stopped', 'API');
  };

  process.once('SIGINT', () => {
    void shutdownTelemetry();
  });
  process.once('SIGTERM', () => {
    void shutdownTelemetry();
  });
}

bootstrap();
