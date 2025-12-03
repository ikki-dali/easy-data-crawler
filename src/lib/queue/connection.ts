import IORedis, { RedisOptions } from 'ioredis';

// Redis接続設定
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// 共有のRedis接続オプション
export const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// BullMQ用のRedis接続を作成
export function createRedisConnection(): IORedis {
  return new IORedis(redisUrl, redisOptions);
}

// シングルトンの接続インスタンス
let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = createRedisConnection();
  }
  return connection;
}

// 接続のクローズ
export async function closeRedisConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}

