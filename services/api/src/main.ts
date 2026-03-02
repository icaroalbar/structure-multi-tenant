import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { startOpenTelemetry } from '../../shared/observability/open-telemetry';
import { writeStructuredLog } from '../../shared/observability/structured-logger';
import { AppModule } from './app.module';
import { loadJwtRuntimeConfig } from './infrastructure/auth/jwt-config';

async function bootstrap(): Promise<void> {
  const logger = new Logger('API');
  const telemetry = startOpenTelemetry({
    serviceName: 'platform-api',
    defaultMetricsPort: 9464
  });

  loadJwtRuntimeConfig();
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3000);

  await app.listen(port);
  writeStructuredLog(logger, 'log', {
    service: 'platform-api',
    event: 'api.bootstrap.listen',
    metadata: { port }
  });

  const shutdownTelemetry = async (): Promise<void> => {
    await telemetry.shutdown();
    writeStructuredLog(logger, 'log', {
      service: 'platform-api',
      event: 'api.telemetry.shutdown'
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
  const logger = new Logger('API');
  writeStructuredLog(logger, 'error', {
    service: 'platform-api',
    event: 'api.bootstrap.error',
    error
  });
  process.exit(1);
});
