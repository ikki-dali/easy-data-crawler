# 1-7: マイグレーション実行・シード作成

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 1-7 |
| **複雑度** | Simple |
| **見積もり** | 1時間 |
| **依存** | 1-6 |
| **ステータス** | ⬜ 未着手 |

## 説明

データベースマイグレーションを実行し、開発用のシードデータを作成する。

## タスク

- [ ] マイグレーション実行
- [ ] シードスクリプト作成
- [ ] npm scripts 追加
- [ ] 動作確認

## 実装詳細

### マイグレーション実行

```bash
# マイグレーション作成・実行
npx prisma migrate dev --name init

# Prisma Client 生成
npx prisma generate

# データベース確認
npx prisma studio
```

### シードスクリプト

```typescript
// prisma/seed.ts
import { PrismaClient, SubscriptionType, Platform, CrawlerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // テストユーザー作成
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'テストユーザー',
      password: hashedPassword,
      subscriptionType: SubscriptionType.PRO,
    },
  });

  console.log('Created user:', user);

  // サンプルクローラー作成
  const crawler = await prisma.crawler.upsert({
    where: { id: 'sample-crawler-1' },
    update: {},
    create: {
      id: 'sample-crawler-1',
      userId: user.id,
      name: 'サンプルクローラー',
      platform: Platform.META_ADS,
      status: CrawlerStatus.ACTIVE,
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sample',
      spreadsheetId: 'sample',
      sheetName: 'Sheet1',
      accountIds: ['123456789'],
      reportConfig: {
        dateRangeType: 'last_x_days_include',
        lookbackDays: 7,
        dimensions: ['date', 'campaign_name'],
        metrics: ['impressions', 'clicks', 'spend'],
        excludeZeroCost: true,
      },
      scheduleConfig: {
        frequency: 'daily',
        executionTime: '07:00',
        timezone: 'Asia/Tokyo',
      },
      tags: ['サンプル'],
    },
  });

  console.log('Created crawler:', crawler);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### package.json に追加

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  },
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio"
  }
}
```

### 追加パッケージ

```bash
npm install -D ts-node
npm install bcryptjs
npm install -D @types/bcryptjs
```

## 完了条件

- [ ] マイグレーションが成功する
- [ ] シードが実行できる
- [ ] Prisma Studio でデータが確認できる
- [ ] npm scripts が動作する

## 参考リソース

- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Seeding](https://www.prisma.io/docs/guides/database/seed-database)

