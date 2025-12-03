import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getLineAuthUrl } from '@/lib/line/client';

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

    const authUrl = getLineAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('LINE OAuth authorize error:', error);
    return NextResponse.json(
      { error: 'OAuth認証の開始に失敗しました' },
      { status: 500 }
    );
  }
}

