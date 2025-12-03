import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { decryptCredentials } from '@/lib/encryption';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const auth = await prisma.platformAuthentication.findFirst({
      where: {
        userId: session.user.id,
        platform: 'GOOGLE_SHEETS',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!auth) {
      return NextResponse.json({
        authenticated: false,
        email: null,
      });
    }

    // トークンの有効期限をチェック
    let isValid = true;
    try {
      const credentials = decryptCredentials(auth.encryptedCredentials);
      if (credentials.expiresAt && credentials.expiresAt < Date.now()) {
        // リフレッシュトークンがあれば有効とみなす（実際の更新は使用時に行う）
        isValid = !!credentials.refreshToken;
      }
    } catch {
      isValid = false;
    }

    return NextResponse.json({
      authenticated: true,
      isValid,
      email: auth.accountIdentifier,
      connectedAt: auth.createdAt,
      updatedAt: auth.updatedAt,
    });
  } catch (error) {
    console.error('Google Sheets status error:', error);
    return NextResponse.json(
      { error: 'ステータスの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 連携解除
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await prisma.platformAuthentication.deleteMany({
      where: {
        userId: session.user.id,
        platform: 'GOOGLE_SHEETS',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Sheets disconnect error:', error);
    return NextResponse.json(
      { error: '連携解除に失敗しました' },
      { status: 500 }
    );
  }
}

