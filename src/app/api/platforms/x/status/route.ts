import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

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
      return NextResponse.json({
        authenticated: false,
      });
    }

    return NextResponse.json({
      authenticated: true,
      username: auth.accountIdentifier,
      connectedAt: auth.createdAt,
      updatedAt: auth.updatedAt,
    });
  } catch (error) {
    console.error('X status error:', error);
    return NextResponse.json(
      { error: 'ステータスの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await prisma.platformAuthentication.deleteMany({
      where: {
        userId: session.user.id,
        platform: 'X_ADS',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('X disconnect error:', error);
    return NextResponse.json(
      { error: '連携解除に失敗しました' },
      { status: 500 }
    );
  }
}

