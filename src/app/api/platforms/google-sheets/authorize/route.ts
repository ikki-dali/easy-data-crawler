import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getGoogleAuthUrl } from '@/lib/google/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // URLパラメータからリダイレクト先を取得
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/';

    // stateにユーザーIDとリダイレクト先を含める
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      returnTo,
    })).toString('base64');

    const authUrl = getGoogleAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth authorize error:', error);
    return NextResponse.json(
      { error: 'OAuth認証の開始に失敗しました' },
      { status: 500 }
    );
  }
}

