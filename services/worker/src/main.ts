import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { createWorkerRmqOptions } from './infrastructure/messaging/rabbitmq-options.factory';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice(WorkerModule, createWorkerRmqOptions());
  await app.listen();
  console.log('Worker connected to RabbitMQ');
}

void bootstrap();
