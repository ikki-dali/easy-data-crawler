import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

// デフォルトで有効なプラットフォーム
const DEFAULT_ENABLED_PLATFORMS = [
  'GOOGLE_ADS',
  'META_ADS',
  'TIKTOK_ADS',
  'X_ADS',
  'LINE_ADS',
];

// GET: プラットフォーム設定を取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザーのプラットフォーム設定を取得
    const settings = await prisma.platformSetting.findMany({
      where: { userId: session.user.id },
      select: {
        platform: true,
        enabled: true,
      },
    });

    // 設定されていないプラットフォームはデフォルト値を使用
    const settingsMap: Record<string, boolean> = {};
    
    for (const platform of DEFAULT_ENABLED_PLATFORMS) {
      settingsMap[platform] = true; // デフォルトは有効
    }
    
    for (const setting of settings) {
      settingsMap[setting.platform] = setting.enabled;
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Platform settings error:', error);
    return NextResponse.json(
      { error: 'プラットフォーム設定の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: プラットフォーム設定を更新
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, enabled } = body;

    if (!platform || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: '無効なリクエストです' },
        { status: 400 }
      );
    }

    // upsertで設定を更新
    await prisma.platformSetting.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform,
        },
      },
      update: { enabled },
      create: {
        userId: session.user.id,
        platform,
        enabled,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Platform settings update error:', error);
    return NextResponse.json(
      { error: 'プラットフォーム設定の更新に失敗しました' },
      { status: 500 }
    );
  }
}

