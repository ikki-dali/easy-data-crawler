# 1-5: Prisma スキーマ（users, platform_authentications）

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 1-5 |
| **複雑度** | Simple |
| **見積もり** | 2時間 |
| **依存** | 1-2 |
| **ステータス** | ⬜ 未着手 |

## 説明

Prisma ORM をセットアップし、ユーザー関連のテーブルスキーマを定義する。

## タスク

- [ ] Prisma インストール・初期化
- [ ] User モデル定義
- [ ] Account モデル定義（NextAuth用）
- [ ] Session モデル定義（NextAuth用）
- [ ] PlatformAuthentication モデル定義
- [ ] Prisma Client 設定

## 実装詳細

### インストール

```bash
npm install prisma @prisma/client
npx prisma init
```

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ユーザー
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String?
  emailVerified     DateTime?
  image             String?
  password          String?   // メール認証用（ハッシュ化）
  subscriptionType  SubscriptionType @default(FREE)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // リレーション
  accounts          Account[]
  sessions          Session[]
  platformAuths     PlatformAuthentication[]
  crawlers          Crawler[]
}

enum SubscriptionType {
  FREE
  STARTER
  ESSENTIAL
  PRO
  ENTERPRISE
}

// NextAuth用 - OAuth アカウント
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

// NextAuth用 - セッション
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// NextAuth用 - メール認証トークン
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// プラットフォーム認証情報
model PlatformAuthentication {
  id                   String   @id @default(cuid())
  userId               String
  platform             Platform
  accountIdentifier    String?  // メール、アカウントID等
  encryptedCredentials String   @db.Text // 暗号化されたJSON
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, platform, accountIdentifier])
  @@index([userId])
}

enum Platform {
  GOOGLE_ADS
  GOOGLE_ANALYTICS
  META_ADS
  TIKTOK_ADS
  LINE_ADS
  LINE_ADS_SYNC
  YAHOO_SEARCH
  YAHOO_DISPLAY
  SMARTNEWS_ADS
  SMARTNEWS_ADS_V2
  MICROSOFT_ADS
  X_ADS
  FACEBOOK_PAGE_INSIGHTS
  INSTAGRAM_INSIGHTS
  AMAZON_SELLER
  AD_EBIS
  GOOGLE_SHEETS
}
```

### Prisma Client 設定

```typescript
// src/lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## 完了条件

- [ ] Prisma がインストールされている
- [ ] スキーマファイルが作成されている
- [ ] エラーなくスキーマが検証される（`npx prisma validate`）
- [ ] Prisma Client が設定されている

## 参考リソース

- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Prisma Adapter](https://authjs.dev/reference/adapter/prisma)

