import { prisma } from '@/lib/db/prisma';
import { addScheduledCrawlerJob, removeScheduledCrawlerJob, CrawlerJobData } from './crawler-queue';
import { ScheduleConfig } from '@/types/report';

// スケジュール設定をcron式に変換
function scheduleToCron(schedule: ScheduleConfig): string {
  const time = schedule.executionTime || '07:00';
  const [hour, minute] = time.split(':').map(Number);

  switch (schedule.frequency) {
    case 'hourly':
      return `${minute} * * * *`; // 毎時X分
    case 'daily':
      return `${minute} ${hour} * * *`; // 毎日X時X分
    case 'weekly':
      const dayOfWeek = schedule.executionDay || 1; // デフォルト月曜日
      return `${minute} ${hour} * * ${dayOfWeek}`; // 毎週X曜日X時X分
    case 'monthly':
      const dayOfMonth = schedule.executionDay || 1; // デフォルト1日
      return `${minute} ${hour} ${dayOfMonth} * *`; // 毎月X日X時X分
    default:
      return `${minute} ${hour} * * *`; // デフォルト: 毎日
  }
}

// クローラーのスケジュールジョブを登録
export async function registerCrawlerSchedule(crawlerId: string): Promise<void> {
  const crawler = await prisma.crawler.findUnique({
    where: { id: crawlerId },
  });

  if (!crawler) {
    throw new Error(`Crawler not found: ${crawlerId}`);
  }

  if (crawler.status !== 'ACTIVE') {
    console.log(`[Scheduler] Crawler ${crawlerId} is not active, skipping schedule`);
    return;
  }

  const scheduleConfig = crawler.scheduleConfig as unknown as ScheduleConfig;
  const reportConfig = crawler.reportConfig as unknown as CrawlerJobData['reportConfig'];

  const jobData: CrawlerJobData = {
    crawlerId: crawler.id,
    userId: crawler.userId,
    platform: crawler.platform,
    accountIds: crawler.accountIds,
    reportConfig: {
      dateRangeType: reportConfig.dateRangeType || 'last_x_days_include',
      lookbackDays: reportConfig.lookbackDays || 7,
      dimensions: reportConfig.dimensions || ['date'],
      metrics: reportConfig.metrics || ['impressions', 'clicks', 'spend'],
      excludeZeroCost: reportConfig.excludeZeroCost || false,
      customConversions: reportConfig.customConversions,
      customEvents: reportConfig.customEvents,
    },
    spreadsheetId: crawler.spreadsheetId,
    sheetName: crawler.sheetName,
    isTest: false,
  };

  const cron = scheduleToCron(scheduleConfig);

  await addScheduledCrawlerJob(crawlerId, jobData, cron);
  console.log(`[Scheduler] Registered schedule for crawler ${crawlerId}: ${cron}`);
}

// クローラーのスケジュールジョブを解除
export async function unregisterCrawlerSchedule(crawlerId: string): Promise<void> {
  await removeScheduledCrawlerJob(crawlerId);
  console.log(`[Scheduler] Unregistered schedule for crawler ${crawlerId}`);
}

// すべてのアクティブなクローラーのスケジュールを初期化
export async function initializeAllSchedules(): Promise<void> {
  const activeCrawlers = await prisma.crawler.findMany({
    where: { status: 'ACTIVE' },
  });

  console.log(`[Scheduler] Initializing schedules for ${activeCrawlers.length} active crawlers`);

  for (const crawler of activeCrawlers) {
    try {
      await registerCrawlerSchedule(crawler.id);
    } catch (error) {
      console.error(`[Scheduler] Failed to register schedule for crawler ${crawler.id}:`, error);
    }
  }
}

// クローラーのステータス変更時のハンドラ
export async function handleCrawlerStatusChange(
  crawlerId: string,
  newStatus: 'ACTIVE' | 'INACTIVE'
): Promise<void> {
  if (newStatus === 'ACTIVE') {
    await registerCrawlerSchedule(crawlerId);
  } else {
    await unregisterCrawlerSchedule(crawlerId);
  }
}

