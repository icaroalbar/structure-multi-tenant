import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { RmqOptions } from '@nestjs/microservices';

import { createWorkerRmqOptions } from './infrastructure/messaging/rabbitmq-options.factory';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<RmqOptions>(
    WorkerModule,
    createWorkerRmqOptions()
  );
  await app.listen();
  Logger.log('Worker connected to RabbitMQ', 'Worker');
}

bootstrap();
