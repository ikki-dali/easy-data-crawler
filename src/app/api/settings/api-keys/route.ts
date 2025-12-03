import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// API設定を取得（環境変数から読み取り）
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 環境変数から設定を取得（マスクされた値を返す）
    const result: Record<string, Record<string, string>> = {
      META_ADS: {
        appId: process.env.META_APP_ID ? '***設定済み***' : '',
        appSecret: process.env.META_APP_SECRET ? '***設定済み***' : '',
      },
      GOOGLE_ADS: {
        developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? '***設定済み***' : '',
        loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '',
      },
      TIKTOK_ADS: {
        appId: process.env.TIKTOK_APP_ID ? '***設定済み***' : '',
        appSecret: process.env.TIKTOK_APP_SECRET ? '***設定済み***' : '',
      },
      X_ADS: {
        apiKey: process.env.X_API_KEY ? '***設定済み***' : '',
        apiSecret: process.env.X_API_SECRET ? '***設定済み***' : '',
        bearerToken: process.env.X_BEARER_TOKEN ? '***設定済み***' : '',
      },
      LINE_ADS: {
        channelId: process.env.LINE_CHANNEL_ID || '',
        channelSecret: process.env.LINE_CHANNEL_SECRET ? '***設定済み***' : '',
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
  }
}

// API設定を保存（環境変数の設定はVercelの環境変数設定で行う）
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 環境変数はVercelの環境変数設定で管理するため、ここでは保存しない
    // 将来的にデータベースに保存する機能を追加する場合は、SystemSettingモデルを追加する必要があります
    
    return NextResponse.json({ 
      success: true,
      message: 'API設定は環境変数で管理されています。Vercelの環境変数設定から変更してください。'
    });
  } catch (error) {
    console.error('Failed to save API keys:', error);
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
  }
}

