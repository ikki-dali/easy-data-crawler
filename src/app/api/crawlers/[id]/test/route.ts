import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { addCrawlerJob, CrawlerJobData } from '@/lib/queue/crawler-queue';

interface Params {
  params: { id: string };
}

// テスト実行
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // クローラー取得と所有権チェック
    const crawler = await prisma.crawler.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!crawler) {
      return NextResponse.json(
        { error: 'クローラーが見つかりません' },
        { status: 404 }
      );
    }

    // ジョブデータを構築
    const reportConfig = crawler.reportConfig as CrawlerJobData['reportConfig'];
    
    const jobData: CrawlerJobData = {
      crawlerId: crawler.id,
      userId: session.user.id,
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
      isTest: true,
      scheduledAt: new Date().toISOString(),
    };

    // BullMQキューにジョブを追加
    const job = await addCrawlerJob(jobData, {
      jobId: `test-${crawler.id}-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      message: 'テスト実行ジョブをキューに追加しました',
      jobId: job.id,
      crawlerId: crawler.id,
    });
  } catch (error) {
    console.error('Test execution error:', error);
    return NextResponse.json(
      { error: 'テスト実行の開始に失敗しました' },
      { status: 500 }
    );
  }
}

