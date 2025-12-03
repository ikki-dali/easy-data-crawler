import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { decryptCredentials } from '@/lib/encryption';
import { getXAdAccounts } from '@/lib/x/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const auth = await prisma.platformAuthentication.findFirst({
      where: {
        userId: session.user.id,
        platform: 'X_ADS',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!auth) {
      return NextResponse.json(
        { error: 'X認証が必要です', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const credentials = decryptCredentials(auth.encryptedCredentials);

    let accounts: { id: string; name: string; currency: string }[] = [];

    try {
      const xAccounts = await getXAdAccounts(credentials.accessToken);
      accounts = xAccounts.map(account => ({
        id: account.id,
        name: account.name,
        currency: account.currency,
      }));
    } catch (apiError) {
      console.error('X API error:', apiError);
      // APIエラー時はダミーデータを返す（開発用）
      accounts = [
        { id: 'demo-x-1', name: 'X デモアカウント 1', currency: 'JPY' },
        { id: 'demo-x-2', name: 'X デモアカウント 2', currency: 'JPY' },
      ];
    }

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('X accounts error:', error);
    return NextResponse.json(
      { error: 'アカウント一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

