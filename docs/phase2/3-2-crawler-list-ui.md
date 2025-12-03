# 3-2: クローラー一覧画面

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 3-2 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 3-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

クローラー一覧画面をAPIと連携し、フィルター・検索機能を実装する。

## タスク

- [ ] APIからクローラー一覧を取得
- [ ] TanStack Query でデータフェッチ
- [ ] フィルターUI（プラットフォーム、ステータス）
- [ ] 検索UI
- [ ] ローディング状態
- [ ] 空の状態

## 実装詳細

### TanStack Query セットアップ

```bash
npm install @tanstack/react-query
```

### クエリフック

```typescript
// src/hooks/use-crawlers.ts
import { useQuery } from '@tanstack/react-query';

interface CrawlerFilters {
  platform?: string;
  status?: string;
  search?: string;
}

async function fetchCrawlers(filters: CrawlerFilters) {
  const params = new URLSearchParams();
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const response = await fetch(`/api/crawlers?${params}`);
  if (!response.ok) throw new Error('Failed to fetch crawlers');
  return response.json();
}

export function useCrawlers(filters: CrawlerFilters = {}) {
  return useQuery({
    queryKey: ['crawlers', filters],
    queryFn: () => fetchCrawlers(filters),
  });
}
```

### フィルターコンポーネント

```typescript
// src/components/crawler/crawler-filters.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PLATFORM_LIST } from '@/types/platform';

interface CrawlerFiltersProps {
  filters: {
    platform: string;
    status: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export function CrawlerFilters({ filters, onFilterChange }: CrawlerFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <Input
        placeholder="クローラー名で検索..."
        value={filters.search}
        onChange={(e) => onFilterChange('search', e.target.value)}
        className="sm:w-64"
      />
      <Select
        value={filters.platform}
        onValueChange={(value) => onFilterChange('platform', value)}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="プラットフォーム" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">すべて</SelectItem>
          {PLATFORM_LIST.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(value) => onFilterChange('status', value)}
      >
        <SelectTrigger className="sm:w-32">
          <SelectValue placeholder="ステータス" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">すべて</SelectItem>
          <SelectItem value="ACTIVE">アクティブ</SelectItem>
          <SelectItem value="INACTIVE">非アクティブ</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

## 完了条件

- [ ] APIからクローラー一覧を取得して表示
- [ ] フィルターが機能する
- [ ] 検索が機能する
- [ ] ローディング中にスケルトンが表示される
- [ ] クローラーがない場合に空の状態が表示される

## 参考リソース

- [TanStack Query](https://tanstack.com/query/latest)

