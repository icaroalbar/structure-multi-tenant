import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PostgresService } from '../src/infrastructure/persistence/postgres.service';
import { RedisService } from '../src/infrastructure/cache/redis.service';

describe('API JWT bootstrap config', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalJwtAlgorithm = process.env.JWT_ALGORITHM;

  afterAll(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalJwtAlgorithm === undefined) {
      delete process.env.JWT_ALGORITHM;
    } else {
      process.env.JWT_ALGORITHM = originalJwtAlgorithm;
    }
  });

  async function bootstrapApp(): Promise<void> {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PostgresService)
      .useValue({ ping: jest.fn().mockResolvedValue(true), onModuleDestroy: jest.fn() })
      .overrideProvider(RedisService)
      .useValue({ ping: jest.fn().mockResolvedValue(true), onModuleDestroy: jest.fn() })
      .compile();

    const app = moduleRef.createNestApplication();

    try {
      await app.init();
    } finally {
      await app.close();
    }
  }

  it('fails bootstrap when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;
    process.env.JWT_ALGORITHM = 'HS256';

    await expect(bootstrapApp()).rejects.toThrow('JWT_SECRET is required');
  });

  it('fails bootstrap when JWT_ALGORITHM is missing', async () => {
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.JWT_ALGORITHM;

    await expect(bootstrapApp()).rejects.toThrow('JWT_ALGORITHM is required');
  });

  it('fails bootstrap when JWT_ALGORITHM is invalid', async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_ALGORITHM = 'INVALID_ALG';

    await expect(bootstrapApp()).rejects.toThrow('JWT_ALGORITHM is invalid');
  });
});
