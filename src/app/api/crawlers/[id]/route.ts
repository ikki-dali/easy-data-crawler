import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { createCrawlerSchema } from '@/lib/validations/crawler';
import { handleCrawlerStatusChange, unregisterCrawlerSchedule } from '@/lib/queue/scheduler';

interface Params {
  params: { id: string };
}

// クローラー詳細取得
export async function GET(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const crawler = await prisma.crawler.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        jobExecutions: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });

    if (!crawler) {
      return NextResponse.json(
        { error: 'クローラーが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(crawler);
  } catch (error) {
    console.error('Crawler fetch error:', error);
    return NextResponse.json(
      { error: 'クローラーの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// クローラー更新
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // 所有権チェック
    const existing = await prisma.crawler.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'クローラーが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // バリデーション（部分更新用にパーシャルスキーマを使用）
    const result = createCrawlerSchema.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'バリデーションエラー' },
        { status: 400 }
      );
    }

    const data = result.data;

    // スプレッドシートIDを再抽出（URLが変更された場合）
    let spreadsheetId = existing.spreadsheetId;
    if (data.spreadsheetUrl) {
      const match = data.spreadsheetUrl.match(
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
      );
      spreadsheetId = match?.[1] || existing.spreadsheetId;
    }

    const crawler = await prisma.crawler.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.platform && { platform: data.platform }),
        ...(data.spreadsheetUrl && { spreadsheetUrl: data.spreadsheetUrl, spreadsheetId }),
        ...(data.sheetName && { sheetName: data.sheetName }),
        ...(data.accountIds && { accountIds: data.accountIds }),
        ...(data.reportConfig && { reportConfig: data.reportConfig }),
        ...(data.scheduleConfig && { scheduleConfig: data.scheduleConfig }),
        ...(data.tags && { tags: data.tags }),
      },
    });

    return NextResponse.json(crawler);
  } catch (error) {
    console.error('Crawler update error:', error);
    return NextResponse.json(
      { error: 'クローラーの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// クローラー削除
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // 所有権チェック
    const existing = await prisma.crawler.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'クローラーが見つかりません' },
        { status: 404 }
      );
    }

    // スケジュールを解除
    try {
      await unregisterCrawlerSchedule(params.id);
    } catch (scheduleError) {
      console.warn('Failed to unregister schedule:', scheduleError);
    }

    await prisma.crawler.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Crawler delete error:', error);
    return NextResponse.json(
      { error: 'クローラーの削除に失敗しました' },
      { status: 500 }
    );
  }
}

// クローラーのステータス変更（有効化/無効化）
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const existing = await prisma.crawler.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'クローラーが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json(
        { error: '無効なステータスです' },
        { status: 400 }
      );
    }

    const crawler = await prisma.crawler.update({
      where: { id: params.id },
      data: { status },
    });

    // スケジュールの登録/解除
    try {
      await handleCrawlerStatusChange(params.id, status);
    } catch (scheduleError) {
      console.warn('Failed to update schedule:', scheduleError);
    }

    return NextResponse.json(crawler);
  } catch (error) {
    console.error('Crawler status update error:', error);
    return NextResponse.json(
      { error: 'ステータスの更新に失敗しました' },
      { status: 500 }
    );
  }
}

