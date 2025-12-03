import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { decryptCredentials } from '@/lib/encryption';
import { getMetaAdAccounts } from '@/lib/meta/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザーのすべてのMeta認証情報を取得
    const auths = await prisma.platformAuthentication.findMany({
      where: {
        userId: session.user.id,
        platform: 'META_ADS',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (auths.length === 0) {
      return NextResponse.json(
        { error: 'Meta認証が必要です', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // すべての認証情報からアカウントを取得
    const allAccounts: Array<{
      id: string;
      name: string;
      currency?: string;
      email?: string;
      accountIdentifier?: string;
    }> = [];

    for (const auth of auths) {
      try {
        const credentials = decryptCredentials(auth.encryptedCredentials);

        // トークンの有効期限をチェック
        if (credentials.expiresAt && credentials.expiresAt < Date.now()) {
          continue; // 期限切れのトークンはスキップ
        }

        // この認証情報に紐づく広告アカウントを取得
        const metaAccounts = await getMetaAdAccounts(credentials.accessToken);
        
        for (const account of metaAccounts) {
          // アカウント名とIDから表示名を生成
          const displayName = account.name || account.accountId;
          const email = credentials.accountName || auth.accountIdentifier || undefined;
          
          allAccounts.push({
            id: account.accountId,
            name: displayName,
            currency: account.currency,
            email: email,
            accountIdentifier: auth.accountIdentifier || undefined,
          });
        }
      } catch (apiError) {
        console.error(`Meta API error for auth ${auth.id}:`, apiError);
        // エラー時はアカウント識別子から情報を生成
        if (auth.accountIdentifier) {
          allAccounts.push({
            id: auth.accountIdentifier,
            name: `アカウント ${auth.accountIdentifier}`,
            accountIdentifier: auth.accountIdentifier,
          });
        }
      }
    }

    // 重複を除去（同じaccountIdの場合は最新のもののみ）
    const uniqueAccounts = Array.from(
      new Map(allAccounts.map(acc => [acc.id, acc])).values()
    );

    return NextResponse.json({ accounts: uniqueAccounts });
  } catch (error) {
    console.error('Meta accounts error:', error);
    return NextResponse.json(
      { error: 'アカウント一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

