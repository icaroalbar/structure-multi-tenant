import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    });
  }

  async ping(): Promise<boolean> {
    try {
      await this.connectIfNeeded();
      return (await this.redis.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async reserveIdempotencyKey(key: string, ttlSeconds: number): Promise<boolean> {
    await this.connectIfNeeded();
    const result = await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private async connectIfNeeded(): Promise<void> {
    if (this.redis.status === 'wait') {
      await this.redis.connect();
    }
  }
}
