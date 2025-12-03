import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const crawlerId = searchParams.get('crawlerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {
      crawler: {
        userId: session.user.id,
        ...(platform && { platform }),
      },
      ...(status && { status: status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' }),
      ...(crawlerId && { crawlerId }),
    };

    const [executions, total] = await Promise.all([
      prisma.jobExecution.findMany({
        where,
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
        take: limit,
        skip: offset,
      }),
      prisma.jobExecution.count({ where }),
    ]);

    return NextResponse.json({
      executions: executions.map((exec) => ({
        id: exec.id,
        crawlerId: exec.crawlerId,
        crawlerName: exec.crawler.name,
        platform: exec.crawler.platform,
        status: exec.status,
        scheduledAt: exec.scheduledAt,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        errorMessage: exec.errorMessage,
        retryCount: exec.retryCount,
        metadata: exec.metadata,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Executions fetch error:', error);
    return NextResponse.json(
      { error: '実行履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}

