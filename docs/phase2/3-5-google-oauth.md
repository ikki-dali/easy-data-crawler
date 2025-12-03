# 3-5: Google OAuth認証フロー（Sheets/Drive）

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 3-5 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 2-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

Google Sheets と Drive へのアクセス用 OAuth 2.0 認証フローを実装する。

## タスク

- [ ] Google OAuth Provider 追加（NextAuth）
- [ ] 必要なスコープ設定
- [ ] トークン保存
- [ ] 認証状態確認API

## 実装詳細

### 必要なスコープ

```
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive.readonly
```

### NextAuth に Google Provider 追加

```typescript
// src/lib/auth/config.ts に追加
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    // 既存の CredentialsProvider...
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    // ...
  },
};
```

### Google認証状態確認API

```typescript
// src/app/api/platforms/google-sheets/status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const auth = await prisma.platformAuthentication.findFirst({
    where: {
      userId: session.user.id,
      platform: 'GOOGLE_SHEETS',
    },
  });

  return NextResponse.json({
    authenticated: !!auth,
    email: auth?.accountIdentifier,
  });
}
```

### 環境変数

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## 完了条件

- [ ] Google OAuth 認証が開始できる
- [ ] 認証後にトークンが保存される
- [ ] 認証状態を確認できる
- [ ] 必要なスコープが付与される

## 参考リソース

- [Google Sheets API Scopes](https://developers.google.com/sheets/api/guides/authorizing)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)

