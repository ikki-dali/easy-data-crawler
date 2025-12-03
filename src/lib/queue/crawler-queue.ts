import { Queue, Job } from 'bullmq';
import { getRedisConnection } from './connection';

// ジョブデータの型定義
export interface CrawlerJobData {
  crawlerId: string;
  userId: string;
  platform: string;
  accountIds: string[];
  reportConfig: {
    dateRangeType: string;
    dateRangeStart?: string;
    dateRangeEnd?: string;
    lookbackDays?: number;
    lookbackMonths?: number;
    dimensions: string[];
    metrics: string[];
    excludeZeroCost: boolean;
    customConversions?: string[];
    customEvents?: string[];
  };
  spreadsheetId: string;
  sheetName: string;
  isTest?: boolean;
  scheduledAt?: string;
}

export interface CrawlerJobResult {
  success: boolean;
  rowsProcessed: number;
  executionTimeMs: number;
  error?: string;
}

// キュー名
export const CRAWLER_QUEUE_NAME = 'crawler-jobs';

// クローラージョブキュー
let crawlerQueue: Queue<CrawlerJobData, CrawlerJobResult> | null = null;

export function getCrawlerQueue(): Queue<CrawlerJobData, CrawlerJobResult> {
  if (!crawlerQueue) {
    crawlerQueue = new Queue<CrawlerJobData, CrawlerJobResult>(CRAWLER_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 60 * 60, // 24時間保持
        },
        removeOnFail: {
          count: 500,
          age: 7 * 24 * 60 * 60, // 7日間保持
        },
      },
    });
  }
  return crawlerQueue;
}

// ジョブを追加
export async function addCrawlerJob(
  data: CrawlerJobData,
  options?: {
    delay?: number;
    priority?: number;
    jobId?: string;
  }
): Promise<Job<CrawlerJobData, CrawlerJobResult>> {
  const queue = getCrawlerQueue();
  
  return queue.add(
    `crawler:${data.crawlerId}`,
    data,
    {
      delay: options?.delay,
      priority: options?.priority,
      jobId: options?.jobId,
    }
  );
}

// スケジュールジョブを追加（繰り返し）
export async function addScheduledCrawlerJob(
  crawlerId: string,
  data: CrawlerJobData,
  cron: string
): Promise<void> {
  const queue = getCrawlerQueue();
  
  // 既存の繰り返しジョブを削除
  await queue.removeRepeatableByKey(`crawler:${crawlerId}:scheduled`);
  
  // 新しい繰り返しジョブを追加
  await queue.add(
    `crawler:${crawlerId}:scheduled`,
    data,
    {
      repeat: {
        pattern: cron,
        tz: 'Asia/Tokyo',
      },
    }
  );
}

// スケジュールジョブを削除
export async function removeScheduledCrawlerJob(crawlerId: string): Promise<void> {
  const queue = getCrawlerQueue();
  await queue.removeRepeatableByKey(`crawler:${crawlerId}:scheduled`);
}

// キューの状態を取得
export async function getQueueStatus(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = getCrawlerQueue();
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);
  
  return { waiting, active, completed, failed, delayed };
}

// キューをクローズ
export async function closeCrawlerQueue(): Promise<void> {
  if (crawlerQueue) {
    await crawlerQueue.close();
    crawlerQueue = null;
  }
}

