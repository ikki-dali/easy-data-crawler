/**
 * Worker Process Entry Point
 * 
 * このファイルはNext.jsアプリとは別のプロセスとして実行されます。
 * 
 * 使用方法:
 *   npx ts-node src/worker.ts
 *   または
 *   npm run worker
 */

import { startCrawlerWorker, stopCrawlerWorker } from './lib/queue/crawler-worker';
import { initializeAllSchedules } from './lib/queue/scheduler';
import { closeRedisConnection } from './lib/queue/connection';
import { closeCrawlerQueue } from './lib/queue/crawler-queue';

async function main() {
  console.log('[Worker] Starting worker process...');

  // Workerを開始
  startCrawlerWorker();

  // すべてのアクティブなクローラーのスケジュールを初期化
  await initializeAllSchedules();

  console.log('[Worker] Worker process started successfully');

  // シャットダウンハンドラ
  const shutdown = async () => {
    console.log('[Worker] Shutting down...');

    try {
      await stopCrawlerWorker();
      await closeCrawlerQueue();
      await closeRedisConnection();
      console.log('[Worker] Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('[Worker] Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});

