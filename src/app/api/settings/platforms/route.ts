import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

const platformInfo: Record<string, { name: string; description: string }> = {
  GOOGLE_SHEETS: {
    name: 'Google Sheets',
    description: 'スプレッドシートへのデータ出力',
  },
  GOOGLE_ADS: {
    name: 'Google Ads',
    description: 'Google 広告のレポートデータ取得',
  },
  META_ADS: {
    name: 'Meta (Facebook/Instagram) Ads',
    description: 'Meta 広告のレポートデータ取得',
  },
  TIKTOK_ADS: {
    name: 'TikTok Ads',
    description: 'TikTok 広告のレポートデータ取得',
  },
  X_ADS: {
    name: 'X (Twitter) Ads',
    description: 'X 広告のレポートデータ取得',
  },
  LINE_ADS: {
    name: 'LINE Ads',
    description: 'LINE 広告のレポートデータ取得',
  },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザーのプラットフォーム認証情報を取得（複数アカウント対応）
    const authentications = await prisma.platformAuthentication.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        platform: true,
        accountIdentifier: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // プラットフォームごとにグループ化
    const authMap = new Map<string, typeof authentications>();
    for (const auth of authentications) {
      if (!authMap.has(auth.platform)) {
        authMap.set(auth.platform, []);
      }
      authMap.get(auth.platform)!.push(auth);
    }

    // すべてのプラットフォームのステータスを返す（複数アカウント対応）
    const platforms = Object.entries(platformInfo).map(([key, info]) => {
      const auths = authMap.get(key) || [];
      return {
        platform: key,
        name: info.name,
        description: info.description,
        authenticated: auths.length > 0,
        accounts: auths.map(auth => ({
          id: auth.id,
          accountIdentifier: auth.accountIdentifier,
          connectedAt: auth.createdAt,
          updatedAt: auth.updatedAt,
        })),
      };
    });

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error('Platform settings error:', error);
    return NextResponse.json(
      { error: 'プラットフォーム情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

