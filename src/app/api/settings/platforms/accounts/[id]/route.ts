import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

// 特定のアカウント連携を削除
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const accountId = params.id;

    // ユーザーが所有しているアカウントか確認
    const auth = await prisma.platformAuthentication.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    });

    if (!auth) {
      return NextResponse.json(
        { error: 'アカウントが見つかりません' },
        { status: 404 }
      );
    }

    // このアカウントを使用しているクローラーをチェック
    const crawlersUsingThisAccount = await prisma.crawler.findMany({
      where: {
        userId: session.user.id,
        platform: auth.platform,
        accountIds: {
          has: auth.accountIdentifier || '',
        },
      },
    });

    if (crawlersUsingThisAccount.length > 0) {
      return NextResponse.json(
        {
          error: 'このアカウントを使用しているクローラーがあります。先にクローラーを削除または編集してください。',
          crawlers: crawlersUsingThisAccount.map(c => ({ id: c.id, name: c.name })),
        },
        { status: 400 }
      );
    }

    // アカウント連携を削除
    await prisma.platformAuthentication.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: '削除に失敗しました' },
      { status: 500 }
    );
  }
}

