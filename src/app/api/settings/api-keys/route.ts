import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { encryptCredentials, decryptCredentials } from '@/lib/encryption';

// API設定を取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // システム設定テーブルから取得（ユーザーIDは管理者のみ）
    const settings = await prisma.systemSetting.findMany({
      where: {
        category: 'api_keys',
      },
    });

    const result: Record<string, Record<string, string>> = {};

    for (const setting of settings) {
      try {
        const decrypted = decryptCredentials(setting.value);
        result[setting.key] = decrypted;
      } catch {
        // 復号化に失敗した場合は空のオブジェクト
        result[setting.key] = {};
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
  }
}

// API設定を保存
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { platform, keys } = await request.json();

    if (!platform || !keys) {
      return NextResponse.json({ error: 'platform と keys が必要です' }, { status: 400 });
    }

    // 暗号化して保存
    const encryptedKeys = encryptCredentials(keys);

    await prisma.systemSetting.upsert({
      where: {
        category_key: {
          category: 'api_keys',
          key: platform,
        },
      },
      update: {
        value: encryptedKeys,
        updatedAt: new Date(),
      },
      create: {
        category: 'api_keys',
        key: platform,
        value: encryptedKeys,
      },
    });

    // 環境変数にも反映（ランタイム用）
    switch (platform) {
      case 'META_ADS':
        if (keys.appId) process.env.META_APP_ID = keys.appId;
        if (keys.appSecret) process.env.META_APP_SECRET = keys.appSecret;
        break;
      case 'GOOGLE_ADS':
        if (keys.developerToken) process.env.GOOGLE_ADS_DEVELOPER_TOKEN = keys.developerToken;
        if (keys.loginCustomerId) process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID = keys.loginCustomerId;
        break;
      case 'TIKTOK_ADS':
        if (keys.appId) process.env.TIKTOK_APP_ID = keys.appId;
        if (keys.appSecret) process.env.TIKTOK_APP_SECRET = keys.appSecret;
        break;
      case 'X_ADS':
        if (keys.apiKey) process.env.X_API_KEY = keys.apiKey;
        if (keys.apiSecret) process.env.X_API_SECRET = keys.apiSecret;
        if (keys.bearerToken) process.env.X_BEARER_TOKEN = keys.bearerToken;
        break;
      case 'LINE_ADS':
        if (keys.channelId) process.env.LINE_CHANNEL_ID = keys.channelId;
        if (keys.channelSecret) process.env.LINE_CHANNEL_SECRET = keys.channelSecret;
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save API keys:', error);
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
  }
}

