import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { decryptCredentials } from '@/lib/encryption';
import { getLineAdAccounts } from '@/lib/line/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const auth = await prisma.platformAuthentication.findFirst({
      where: {
        userId: session.user.id,
        platform: 'LINE_ADS',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!auth) {
      return NextResponse.json(
        { error: 'LINE認証が必要です', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const credentials = decryptCredentials(auth.encryptedCredentials);

    let accounts: { id: string; name: string; currency: string }[] = [];

    try {
      const lineAccounts = await getLineAdAccounts(credentials.accessToken);
      accounts = lineAccounts.map(account => ({
        id: account.accountId,
        name: account.accountName,
        currency: account.currency,
      }));
    } catch (apiError) {
      console.error('LINE API error:', apiError);
      // APIエラー時はダミーデータを返す（開発用）
      accounts = [
        { id: 'demo-line-1', name: 'LINE デモアカウント 1', currency: 'JPY' },
        { id: 'demo-line-2', name: 'LINE デモアカウント 2', currency: 'JPY' },
      ];
    }

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('LINE accounts error:', error);
    return NextResponse.json(
      { error: 'アカウント一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

