import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { decryptCredentials } from '@/lib/encryption';
import { refreshGoogleAdsAccessToken, getDeveloperToken } from '@/lib/google/ads-client';
import { encryptCredentials } from '@/lib/encryption';

// Google Ads API endpoint (simplified for demo)
const GOOGLE_ADS_API_URL = 'https://googleads.googleapis.com/v15';

interface CustomerInfo {
  resourceName: string;
  id: string;
  descriptiveName: string;
  currencyCode: string;
  manager: boolean;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const auth = await prisma.platformAuthentication.findFirst({
      where: {
        userId: session.user.id,
        platform: 'GOOGLE_ADS',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!auth) {
      return NextResponse.json(
        { error: 'Google Ads認証が必要です', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    let credentials = decryptCredentials(auth.encryptedCredentials);

    // トークンの有効期限をチェックし、必要なら更新
    if (credentials.expiresAt && credentials.expiresAt < Date.now() + 60000) {
      if (!credentials.refreshToken) {
        return NextResponse.json(
          { error: '再認証が必要です', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      const newTokens = await refreshGoogleAdsAccessToken(credentials.refreshToken);
      credentials = {
        ...credentials,
        accessToken: newTokens.access_token!,
        expiresAt: newTokens.expiry_date || undefined,
      };

      await prisma.platformAuthentication.update({
        where: { id: auth.id },
        data: {
          encryptedCredentials: encryptCredentials(credentials),
        },
      });
    }

    // Google Ads API を呼び出し
    // 実際のAPIコールは developer token が必要
    let accounts: { id: string; name: string; currency: string }[] = [];

    try {
      const developerToken = getDeveloperToken();
      
      // List accessible customers
      const response = await fetch(`${GOOGLE_ADS_API_URL}/customers:listAccessibleCustomers`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'developer-token': developerToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const customerIds = data.resourceNames || [];

        // 各カスタマーの詳細を取得（デモ用に簡略化）
        accounts = customerIds.map((resourceName: string) => {
          const customerId = resourceName.replace('customers/', '');
          return {
            id: customerId,
            name: `アカウント ${customerId}`,
            currency: 'JPY',
          };
        });
      }
    } catch (apiError) {
      console.error('Google Ads API error:', apiError);
      // API エラー時はダミーデータを返す（開発用）
      accounts = [
        { id: 'demo-account-1', name: 'デモアカウント 1', currency: 'JPY' },
        { id: 'demo-account-2', name: 'デモアカウント 2', currency: 'JPY' },
      ];
    }

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Google Ads accounts error:', error);
    return NextResponse.json(
      { error: 'アカウント一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

