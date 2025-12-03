import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { createCrawlerSchema } from '@/lib/validations/crawler';

// クローラー一覧取得
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  try {
    const crawlers = await prisma.crawler.findMany({
      where: {
        userId: session.user.id,
        ...(platform && { platform: platform as any }),
        ...(status && { status: status as any }),
        ...(search && {
          name: { contains: search, mode: 'insensitive' },
        }),
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(crawlers);
  } catch (error) {
    console.error('Crawlers fetch error:', error);
    return NextResponse.json(
      { error: 'クローラーの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// クローラー作成
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // バリデーション
    const result = createCrawlerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'バリデーションエラー' },
        { status: 400 }
      );
    }

    const data = result.data;

    // スプレッドシートIDを抽出
    const spreadsheetIdMatch = data.spreadsheetUrl.match(
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    );
    const spreadsheetId = spreadsheetIdMatch?.[1];

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: '無効なスプレッドシートURLです' },
        { status: 400 }
      );
    }

    // クローラー作成
    const crawler = await prisma.crawler.create({
      data: {
        userId: session.user.id,
        name: data.name,
        platform: data.platform,
        status: 'INACTIVE',
        spreadsheetUrl: data.spreadsheetUrl,
        spreadsheetId,
        sheetName: data.sheetName,
        accountIds: data.accountIds,
        reportConfig: data.reportConfig,
        scheduleConfig: data.scheduleConfig,
        tags: data.tags || [],
      },
    });

    return NextResponse.json(crawler, { status: 201 });
  } catch (error) {
    console.error('Crawler creation error:', error);
    return NextResponse.json(
      { error: 'クローラーの作成に失敗しました' },
      { status: 500 }
    );
  }
}

