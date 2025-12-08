import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { decryptCredentials } from '@/lib/encryption';

const platformInfo: Record<string, { name: string; description: string }> = {
  GOOGLE_SHEETS: {
    name: 'Google Sheets',
    description: 'スプレッドシートへのデータ出力',
  },
  GOOGLE_ADS: {
    name: 'Google Ads',
    description: 'Google 広告のレポートデータ取得',
  },
  META_ADS: {
    name: 'Meta (Facebook/Instagram) Ads',
    description: 'Meta 広告のレポートデータ取得',
  },
  TIKTOK_ADS: {
    name: 'TikTok Ads',
    description: 'TikTok 広告のレポートデータ取得',
  },
  X_ADS: {
    name: 'X (Twitter) Ads',
    description: 'X 広告のレポートデータ取得',
  },
  LINE_ADS: {
    name: 'LINE Ads',
    description: 'LINE 広告のレポートデータ取得',
  },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザーのプラットフォーム認証情報を取得（複数アカウント対応）
    const authentications = await prisma.platformAuthentication.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        platform: true,
        accountIdentifier: true,
        encryptedCredentials: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // プラットフォームごとにグループ化
    const authMap = new Map<string, typeof authentications>();
    for (const auth of authentications) {
      if (!authMap.has(auth.platform)) {
        authMap.set(auth.platform, []);
      }
      authMap.get(auth.platform)!.push(auth);
    }

    // すべてのプラットフォームのステータスを返す（複数アカウント対応）
    const platforms = Object.entries(platformInfo).map(([key, info]) => {
      const auths = authMap.get(key) || [];
      
      // Meta Adsの場合はユーザー名とメールアドレスでグループ化
      if (key === 'META_ADS') {
        const userGroups = new Map<string, typeof auths>();
        for (const auth of auths) {
          let userName: string | null = null;
          let userEmail: string | null = null;
          
          try {
            const credentials = decryptCredentials(auth.encryptedCredentials);
            userName = credentials.userName || null;
            userEmail = credentials.userEmail || null;
          } catch (error) {
            console.error(`Failed to decrypt credentials for auth ${auth.id}:`, error);
          }
          
          // ユーザー識別子を作成（userName + userEmail）
          const userKey = userName && userEmail 
            ? `${userName}|||${userEmail}`
            : userName || userEmail || auth.accountIdentifier || 'unknown';
          
          if (!userGroups.has(userKey)) {
            userGroups.set(userKey, []);
          }
          userGroups.get(userKey)!.push(auth);
        }
        
        // グループ化されたアカウントを返す
        const groupedAccounts = Array.from(userGroups.entries()).map(([userKey, groupAuths]) => {
          const firstAuth = groupAuths[0];
          let userName: string | null = null;
          let userEmail: string | null = null;
          
          try {
            const credentials = decryptCredentials(firstAuth.encryptedCredentials);
            userName = credentials.userName || null;
            userEmail = credentials.userEmail || null;
          } catch (error) {
            console.error(`Failed to decrypt credentials for auth ${firstAuth.id}:`, error);
          }
          
          // 最新の更新日時を取得
          const latestUpdatedAt = groupAuths.reduce((latest, auth) => 
            auth.updatedAt > latest ? auth.updatedAt : latest, 
            groupAuths[0].updatedAt
          );
          
          // 最も古い作成日時を取得
          const earliestCreatedAt = groupAuths.reduce((earliest, auth) => 
            auth.createdAt < earliest ? auth.createdAt : earliest, 
            groupAuths[0].createdAt
          );
          
          // グループ内の各アカウント情報を取得
          const accountDetails = groupAuths.map(auth => {
            let accountName: string | null = null;
            try {
              const credentials = decryptCredentials(auth.encryptedCredentials);
              accountName = credentials.accountName || null;
            } catch (error) {
              console.error(`Failed to decrypt credentials for auth ${auth.id}:`, error);
            }
            
            return {
              id: auth.id,
              accountIdentifier: auth.accountIdentifier,
              accountName: accountName || auth.accountIdentifier || 'アカウント',
              connectedAt: auth.createdAt,
              updatedAt: auth.updatedAt,
            };
          });
          
          return {
            id: firstAuth.id, // 最初のアカウントのIDを使用（削除時に全アカウントを削除する必要がある場合は変更が必要）
            accountIdentifier: firstAuth.accountIdentifier,
            displayName: userName && userEmail ? `${userName} - ${userEmail}` : userName || userEmail || 'アカウント',
            userName,
            userEmail,
            accountCount: groupAuths.length, // グループ内のアカウント数
            accountIds: groupAuths.map(a => a.id), // すべてのアカウントID
            accountDetails, // グループ内の各アカウントの詳細情報
            connectedAt: earliestCreatedAt,
            updatedAt: latestUpdatedAt,
          };
        });
        
        return {
          platform: key,
          name: info.name,
          description: info.description,
          authenticated: groupedAccounts.length > 0,
          accounts: groupedAccounts,
        };
      }
      
      // その他のプラットフォームは従来通り
      return {
        platform: key,
        name: info.name,
        description: info.description,
        authenticated: auths.length > 0,
        accounts: auths.map(auth => {
          // 暗号化された認証情報からユーザー情報を取得
          let userName: string | null = null;
          let userEmail: string | null = null;
          let accountName: string | null = null;
          
          try {
            const credentials = decryptCredentials(auth.encryptedCredentials);
            userName = credentials.userName || null;
            userEmail = credentials.userEmail || null;
            accountName = credentials.accountName || null;
          } catch (error) {
            console.error(`Failed to decrypt credentials for auth ${auth.id}:`, error);
          }
          
          // 表示名を決定（優先順位: userName + userEmail > accountName > accountIdentifier）
          let displayName = auth.accountIdentifier || 'アカウント';
          if (userName && userEmail) {
            displayName = `${userName} - ${userEmail}`;
          } else if (accountName) {
            displayName = accountName;
          } else if (userName) {
            displayName = userName;
          } else if (userEmail) {
            displayName = userEmail;
          }
          
          return {
            id: auth.id,
            accountIdentifier: auth.accountIdentifier,
            displayName,
            userName,
            userEmail,
            connectedAt: auth.createdAt,
            updatedAt: auth.updatedAt,
          };
        }),
      };
    });

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error('Platform settings error:', error);
    return NextResponse.json(
      { error: 'プラットフォーム情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

