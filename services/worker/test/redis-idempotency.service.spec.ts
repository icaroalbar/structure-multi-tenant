import Redis from 'ioredis';

import { RedisIdempotencyService } from '../src/infrastructure/cache/redis-idempotency.service';

type MockRedisClient = {
  status: string;
  connect: jest.Mock<Promise<void>, []>;
  set: jest.Mock<Promise<string | null>, [string, string, 'EX', number, 'NX']>;
  ping: jest.Mock<Promise<string>, []>;
  quit: jest.Mock<Promise<'OK'>, []>;
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('RedisIdempotencyService', () => {
  const RedisMock = Redis as unknown as jest.Mock;

  let mockRedisClient: MockRedisClient;
  let service: RedisIdempotencyService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRedisClient = {
      status: 'wait',
      connect: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue('OK'),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue('OK')
    };

    RedisMock.mockImplementation(() => mockRedisClient);

    service = new RedisIdempotencyService();
  });

  it('reserves key using NX and TTL when key is available', async () => {
    await expect(service.reserve('job:tenant:1', 3600)).resolves.toBe(true);

    expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
    expect(mockRedisClient.set).toHaveBeenCalledWith('job:tenant:1', '1', 'EX', 3600, 'NX');
  });

  it('returns false when key is already reserved', async () => {
    mockRedisClient.status = 'ready';
    mockRedisClient.set.mockResolvedValueOnce(null);

    await expect(service.reserve('job:tenant:1', 3600)).resolves.toBe(false);

    expect(mockRedisClient.connect).not.toHaveBeenCalled();
  });

  it('returns false on ping failures', async () => {
    mockRedisClient.ping.mockRejectedValueOnce(new Error('redis unavailable'));

    await expect(service.ping()).resolves.toBe(false);
  });

  it('quits redis connection on module destroy', async () => {
    await service.onModuleDestroy();

    expect(mockRedisClient.quit).toHaveBeenCalledTimes(1);
  });
});
