import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { listRecentSpreadsheets } from '@/lib/google/sheets';

// 最近使ったスプレッドシート一覧を取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const spreadsheets = await listRecentSpreadsheets(session.user.id);

    return NextResponse.json({ spreadsheets });
  } catch (error) {
    console.error('List spreadsheets error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Google認証')) {
        return NextResponse.json(
          { error: 'Google認証が必要です', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'スプレッドシート一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

