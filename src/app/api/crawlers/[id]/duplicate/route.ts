import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

interface Params {
  params: { id: string };
}

// クローラー複製
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    // 元のクローラーを取得
    const original = await prisma.crawler.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!original) {
      return NextResponse.json(
        { error: 'クローラーが見つかりません' },
        { status: 404 }
      );
    }

    // リクエストボディから新しい名前を取得（オプション）
    let newName = `コピー ～ ${original.name}`;
    try {
      const body = await request.json();
      if (body.name) {
        newName = body.name;
      }
    } catch {
      // ボディがない場合はデフォルト名を使用
    }

    // 複製を作成
    const duplicate = await prisma.crawler.create({
      data: {
        userId: session.user.id,
        name: newName,
        platform: original.platform,
        status: 'INACTIVE', // 複製は常に INACTIVE で作成
        spreadsheetUrl: original.spreadsheetUrl,
        spreadsheetId: original.spreadsheetId,
        sheetName: original.sheetName,
        accountIds: original.accountIds,
        reportConfig: original.reportConfig as object,
        scheduleConfig: original.scheduleConfig as object,
        tags: original.tags,
      },
    });

    return NextResponse.json({ crawler: duplicate }, { status: 201 });
  } catch (error) {
    console.error('Crawler duplicate error:', error);
    return NextResponse.json(
      { error: 'クローラーの複製に失敗しました' },
      { status: 500 }
    );
  }
}

