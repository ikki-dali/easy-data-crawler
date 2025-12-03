import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './connection';
import { CrawlerJobData, CrawlerJobResult, CRAWLER_QUEUE_NAME } from './crawler-queue';
import { prisma } from '@/lib/db/prisma';
import { fetchGoogleAdsData } from '@/lib/platforms/google-ads';
import { fetchMetaAdsData } from '@/lib/platforms/meta-ads';
import { fetchTikTokAdsData } from '@/lib/platforms/tiktok-ads';
import { fetchXAdsData } from '@/lib/platforms/x-ads';
import { fetchLineAdsData } from '@/lib/platforms/line-ads';
import { writeToSpreadsheet } from '@/lib/platforms/sheets-writer';

// ジョブ処理関数
async function processCrawlerJob(
  job: Job<CrawlerJobData, CrawlerJobResult>
): Promise<CrawlerJobResult> {
  const startTime = Date.now();
  const { crawlerId, platform, accountIds, reportConfig, spreadsheetId, sheetName, isTest } = job.data;

  console.log(`[Worker] Processing job ${job.id} for crawler ${crawlerId}`);

  // ジョブ実行レコードを作成または更新
  const jobExecution = await prisma.jobExecution.create({
    data: {
      crawlerId,
      status: 'RUNNING',
      scheduledAt: job.data.scheduledAt ? new Date(job.data.scheduledAt) : new Date(),
      startedAt: new Date(),
    },
  });

  try {
    // プログレス更新
    await job.updateProgress(10);

    // プラットフォームからデータを取得
    let reportData: Record<string, unknown>[] = [];

    switch (platform) {
      case 'GOOGLE_ADS':
        reportData = await fetchGoogleAdsData(job.data);
        break;
      case 'META_ADS':
        reportData = await fetchMetaAdsData(job.data);
        break;
      case 'TIKTOK_ADS':
        reportData = await fetchTikTokAdsData(
          '', // accessToken - would be fetched from DB
          accountIds[0], // advertiserId
          accountIds,
          reportConfig as import('@/types/report').ReportConfig
        );
        break;
      case 'X_ADS':
        reportData = await fetchXAdsData(
          '', // accessToken - would be fetched from DB
          accountIds,
          reportConfig as import('@/types/report').ReportConfig
        );
        break;
      case 'LINE_ADS':
        reportData = await fetchLineAdsData(
          '', // accessToken - would be fetched from DB
          accountIds,
          reportConfig as import('@/types/report').ReportConfig
        );
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    await job.updateProgress(50);

    // スプレッドシートに書き込み
    if (!isTest || reportData.length > 0) {
      await writeToSpreadsheet({
        userId: job.data.userId,
        spreadsheetId,
        sheetName,
        data: reportData,
        dimensions: reportConfig.dimensions,
        metrics: reportConfig.metrics,
      });
    }

    await job.updateProgress(90);

    const executionTime = Date.now() - startTime;

    // 成功時の更新
    await prisma.jobExecution.update({
      where: { id: jobExecution.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: {
          executionTimeMs: executionTime,
          rowsProcessed: reportData.length,
          isTest: !!isTest,
        },
      },
    });

    // クローラーの最終実行時刻を更新
    await prisma.crawler.update({
      where: { id: crawlerId },
      data: { lastExecutedAt: new Date() },
    });

    console.log(`[Worker] Job ${job.id} completed: ${reportData.length} rows processed`);

    return {
      success: true,
      rowsProcessed: reportData.length,
      executionTimeMs: executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 失敗時の更新
    await prisma.jobExecution.update({
      where: { id: jobExecution.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage,
        retryCount: job.attemptsMade,
      },
    });

    console.error(`[Worker] Job ${job.id} failed:`, errorMessage);

    // エラーを再スローしてBullMQにリトライさせる
    throw error;
  }
}

// Worker インスタンス
let worker: Worker<CrawlerJobData, CrawlerJobResult> | null = null;

export function startCrawlerWorker(): Worker<CrawlerJobData, CrawlerJobResult> {
  if (worker) {
    return worker;
  }

  worker = new Worker<CrawlerJobData, CrawlerJobResult>(
    CRAWLER_QUEUE_NAME,
    processCrawlerJob,
    {
      connection: getRedisConnection(),
      concurrency: 5, // 同時実行数
      limiter: {
        max: 10,
        duration: 1000, // 1秒間に10ジョブまで
      },
    }
  );

  // イベントハンドラ
  worker.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed with result:`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[Worker] Error:', error);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`[Worker] Job ${jobId} stalled`);
  });

  console.log('[Worker] Crawler worker started');

  return worker;
}

export async function stopCrawlerWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('[Worker] Crawler worker stopped');
  }
}

export function getCrawlerWorker(): Worker<CrawlerJobData, CrawlerJobResult> | null {
  return worker;
}

