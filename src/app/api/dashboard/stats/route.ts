import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;

    // クローラー統計を並列で取得
    const [
      totalCrawlers,
      activeCrawlers,
      totalExecutions,
      successfulExecutions,
      recentExecutions,
      platformStats,
    ] = await Promise.all([
      // 全クローラー数
      prisma.crawler.count({ where: { userId } }),
      
      // アクティブなクローラー数
      prisma.crawler.count({ where: { userId, status: 'ACTIVE' } }),
      
      // 全実行回数
      prisma.jobExecution.count({
        where: { crawler: { userId } },
      }),
      
      // 成功した実行回数
      prisma.jobExecution.count({
        where: { crawler: { userId }, status: 'COMPLETED' },
      }),
      
      // 最近の実行履歴（10件）
      prisma.jobExecution.findMany({
        where: { crawler: { userId } },
        include: {
          crawler: {
            select: {
              id: true,
              name: true,
              platform: true,
            },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        take: 10,
      }),
      
      // プラットフォーム別統計
      prisma.crawler.groupBy({
        by: ['platform'],
        where: { userId },
        _count: { id: true },
      }),
    ]);

    // 成功率を計算
    const successRate = totalExecutions > 0
      ? Math.round((successfulExecutions / totalExecutions) * 100)
      : 0;

    // プラットフォーム別の成功率も計算
    const platformStatsWithRate = await Promise.all(
      platformStats.map(async (stat) => {
        const [total, successful] = await Promise.all([
          prisma.jobExecution.count({
            where: {
              crawler: { userId, platform: stat.platform },
            },
          }),
          prisma.jobExecution.count({
            where: {
              crawler: { userId, platform: stat.platform },
              status: 'COMPLETED',
            },
          }),
        ]);

        return {
          platform: stat.platform,
          count: stat._count.id,
          successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
        };
      })
    );

    return NextResponse.json({
      totalCrawlers,
      activeCrawlers,
      totalExecutions,
      successRate,
      recentExecutions: recentExecutions.map((exec) => ({
        id: exec.id,
        crawlerId: exec.crawlerId,
        crawlerName: exec.crawler.name,
        platform: exec.crawler.platform,
        status: exec.status,
        scheduledAt: exec.scheduledAt,
        completedAt: exec.completedAt,
        errorMessage: exec.errorMessage,
      })),
      platformStats: platformStatsWithRate,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: '統計の取得に失敗しました' },
      { status: 500 }
    );
  }
}

