import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getTikTokAuthUrl } from '@/lib/tiktok/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/';

    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      returnTo,
    })).toString('base64');

    const authUrl = getTikTokAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('TikTok OAuth authorize error:', error);
    const errorMessage = error instanceof Error ? error.message : 'OAuth認証の開始に失敗しました';
    
    // 環境変数が設定されていない場合のエラーメッセージ
    if (errorMessage.includes('not configured')) {
      return NextResponse.json(
        { 
          error: 'TikTok OAuth認証情報が設定されていません。環境変数TIKTOK_APP_IDとTIKTOK_APP_SECRETを設定してください。' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: `OAuth認証の開始に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}

