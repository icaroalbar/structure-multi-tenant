import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PostgresService } from '../src/infrastructure/persistence/postgres.service';
import { RedisService } from '../src/infrastructure/cache/redis.service';

function buildJwt(payload: Record<string, unknown>, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

describe('API bootstrap', () => {
  let app: INestApplication;
  const jwtSecret = 'test-secret';

  beforeAll(async () => {
    process.env.JWT_SECRET = jwtSecret;
    process.env.JWT_ALGORITHM = 'HS256';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PostgresService)
      .useValue({ ping: jest.fn().mockResolvedValue(true), onModuleDestroy: jest.fn() })
      .overrideProvider(RedisService)
      .useValue({ ping: jest.fn().mockResolvedValue(true), onModuleDestroy: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok when dependencies are up', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      dependencies: {
        postgres: 'up',
        redis: 'up'
      }
    });
  });

  it('GET /tenant/me extracts tenant_id from JWT', async () => {
    const token = buildJwt({ sub: 'user-1', tenant_id: 'tenant-acme' }, jwtSecret);

    const response = await request(app.getHttpServer())
      .get('/tenant/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      tenantId: 'tenant-acme',
      subject: 'user-1'
    });
  });

  it('GET /tenant/me rejects missing token', async () => {
    await request(app.getHttpServer()).get('/tenant/me').expect(401);
  });
});
