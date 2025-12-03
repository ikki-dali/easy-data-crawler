import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

interface Params {
  params: { id: string };
}

// ジョブ実行履歴取得
export async function GET(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // クローラー所有権チェック
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    const executions = await prisma.jobExecution.findMany({
      where: {
        crawlerId: params.id,
        ...(status && { status: status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' }),
      },
      orderBy: { scheduledAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.jobExecution.count({
      where: {
        crawlerId: params.id,
        ...(status && { status: status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' }),
      },
    });

    return NextResponse.json({
      executions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
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

