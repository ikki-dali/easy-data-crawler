# 3-1: クローラー一覧API

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 3-1 |
| **複雑度** | Simple |
| **見積もり** | 1時間 |
| **依存** | 1-6, 2-4 |
| **ステータス** | ⬜ 未着手 |

## 説明

認証済みユーザーのクローラー一覧を取得するAPIエンドポイントを作成する。

## タスク

- [ ] GET /api/crawlers エンドポイント作成
- [ ] フィルター機能（platform, status, tags）
- [ ] 検索機能（name）
- [ ] ページネーション（オプション）

## 実装詳細

### APIエンドポイント

```typescript
// src/app/api/crawlers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const crawlers = await prisma.crawler.findMany({
    where: {
      userId: session.user.id,
      ...(platform && { platform: platform as any }),
      ...(status && { status: status as any }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(crawlers);
}
```

### レスポンス型

```typescript
interface CrawlerListResponse {
  id: string;
  name: string;
  platform: Platform;
  status: CrawlerStatus;
  spreadsheetUrl: string;
  tags: string[];
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## 完了条件

- [ ] GET /api/crawlers が認証済みユーザーのクローラーを返す
- [ ] フィルター（platform, status）が機能する
- [ ] 検索（name）が機能する
- [ ] 未認証時に401を返す

## 参考リソース

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

