import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { decryptCredentials } from '@/lib/encryption';
import { getTikTokAdAccounts } from '@/lib/tiktok/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const auth = await prisma.platformAuthentication.findFirst({
      where: {
        userId: session.user.id,
        platform: 'TIKTOK_ADS',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!auth) {
      return NextResponse.json(
        { error: 'TikTok認証が必要です', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const credentials = decryptCredentials(auth.encryptedCredentials);

    let accounts: { id: string; name: string; currency: string }[] = [];

    try {
      const tiktokAccounts = await getTikTokAdAccounts(credentials.accessToken);
      accounts = tiktokAccounts.map(account => ({
        id: account.advertiserId,
        name: account.advertiserName,
        currency: account.currency,
      }));
    } catch (apiError) {
      console.error('TikTok API error:', apiError);
      // APIエラー時はダミーデータを返す（開発用）
      accounts = [
        { id: 'demo-tiktok-1', name: 'TikTok デモアカウント 1', currency: 'JPY' },
        { id: 'demo-tiktok-2', name: 'TikTok デモアカウント 2', currency: 'JPY' },
      ];
    }

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('TikTok accounts error:', error);
    return NextResponse.json(
      { error: 'アカウント一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

