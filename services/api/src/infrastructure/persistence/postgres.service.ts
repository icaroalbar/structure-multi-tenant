import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString:
        process.env.POSTGRES_URL ??
        'postgres://platform:platform@localhost:5432/platform',
      max: 3,
      idleTimeoutMillis: 5_000
    });
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT 1 as ok');
      return result.rowCount === 1;
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
