import { Controller, Get } from '@nestjs/common';

import { RedisService } from '../../infrastructure/cache/redis.service';
import { PostgresService } from '../../infrastructure/persistence/postgres.service';

@Controller()
export class HealthController {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly redisService: RedisService
  ) {}

  @Get('health')
  async health(): Promise<{
    status: 'ok' | 'degraded';
    dependencies: {
      postgres: 'up' | 'down';
      redis: 'up' | 'down';
    };
  }> {
    const [postgresUp, redisUp] = await Promise.all([
      this.postgresService.ping(),
      this.redisService.ping()
    ]);

    return {
      status: postgresUp && redisUp ? 'ok' : 'degraded',
      dependencies: {
        postgres: postgresUp ? 'up' : 'down',
        redis: redisUp ? 'up' : 'down'
      }
    };
  }
}
