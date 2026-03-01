import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PostgresService } from '../src/infrastructure/persistence/postgres.service';
import { RedisService } from '../src/infrastructure/cache/redis.service';

function buildJwt(payload: Record<string, unknown>): string {
  const base64Url = (value: string): string =>
    Buffer.from(value, 'utf-8')
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const header = base64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = base64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('API bootstrap', () => {
  let app: INestApplication;

  beforeAll(async () => {
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
    const token = buildJwt({ sub: 'user-1', tenant_id: 'tenant-acme' });

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
