import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/services'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['services/**/*.ts', '!services/**/main.ts'],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 45,
      lines: 45,
      statements: 45
    },
    './services/worker/src/interfaces/messages/job.consumer.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './services/worker/src/infrastructure/messaging/rabbitmq-topology.service.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './services/worker/src/infrastructure/cache/redis-idempotency.service.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './services/api/src/application/tenancy/get-tenant-context.usecase.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './services/api/src/interfaces/http/tenant.controller.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};

export default config;
