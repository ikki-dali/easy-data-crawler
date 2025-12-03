# 6-3: クローラー作成API

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 6-3 |
| **複雑度** | Medium |
| **見積もり** | 2時間 |
| **依存** | 6-2 |
| **ステータス** | ⬜ 未着手 |

## 説明

クローラーを作成するAPIエンドポイントを実装する。

## タスク

- [ ] POST /api/crawlers エンドポイント
- [ ] バリデーション
- [ ] スプレッドシートID抽出
- [ ] データベース保存

## 実装詳細

### APIエンドポイント

```typescript
// src/app/api/crawlers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { createCrawlerSchema } from '@/lib/validations/crawler';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // バリデーション
    const result = createCrawlerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'バリデーションエラー' },
        { status: 400 }
      );
    }

    const data = result.data;

    // スプレッドシートIDを抽出
    const spreadsheetIdMatch = data.spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const spreadsheetId = spreadsheetIdMatch?.[1];

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: '無効なスプレッドシートURLです' },
        { status: 400 }
      );
    }

    // クローラー作成
    const crawler = await prisma.crawler.create({
      data: {
        userId: session.user.id,
        name: data.name,
        platform: data.platform,
        status: 'INACTIVE',
        spreadsheetUrl: data.spreadsheetUrl,
        spreadsheetId,
        sheetName: data.sheetName,
        accountIds: data.accountIds,
        reportConfig: data.reportConfig,
        scheduleConfig: data.scheduleConfig,
        tags: data.tags || [],
      },
    });

    return NextResponse.json(crawler, { status: 201 });
  } catch (error) {
    console.error('Crawler creation error:', error);
    return NextResponse.json(
      { error: 'クローラーの作成に失敗しました' },
      { status: 500 }
    );
  }
}
```

### バリデーションスキーマ

```typescript
// src/lib/validations/crawler.ts
import { z } from 'zod';
import { Platform } from '@prisma/client';

export const createCrawlerSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.nativeEnum(Platform),
  spreadsheetUrl: z.string().url(),
  sheetName: z.string().min(1),
  accountIds: z.array(z.string()).min(1),
  reportConfig: z.object({
    dateRangeType: z.string(),
    dateRangeStart: z.string().optional(),
    dateRangeEnd: z.string().optional(),
    lookbackDays: z.number().optional(),
    lookbackMonths: z.number().optional(),
    dimensions: z.array(z.string()),
    metrics: z.array(z.string()).min(1),
    customConversions: z.array(z.object({
      conversionId: z.string(),
    })).optional(),
    customEvents: z.array(z.object({
      eventName: z.string(),
    })).optional(),
    excludeZeroCost: z.boolean(),
  }),
  scheduleConfig: z.object({
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
    executionTime: z.string().optional(),
    executionDay: z.number().optional(),
    timezone: z.string(),
  }),
  tags: z.array(z.string()).max(5).optional(),
});
```

## 完了条件

- [ ] POST /api/crawlers でクローラーを作成できる
- [ ] バリデーションが機能する
- [ ] データベースに保存される
- [ ] 作成したクローラーが返される

## 参考リソース

- [REQUIREMENTS.md - API仕様](../../REQUIREMENTS.md)

