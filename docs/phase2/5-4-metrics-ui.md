# 5-4: メトリクス選択UI

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 5-4 |
| **複雑度** | Medium |
| **見積もり** | 2時間 |
| **依存** | 5-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

レポートのメトリクス（指標）を選択するUIを作成する。カテゴリ分けして表示。

## タスク

- [ ] プラットフォーム別メトリクス定義
- [ ] カテゴリ別表示
- [ ] 複数選択UI
- [ ] よく使うメトリクスの優先表示

## 実装詳細

### メトリクス定義

```typescript
// src/lib/platform-config/meta-ads.ts
export const META_ADS_METRICS = {
  common: {
    label: 'よく使う',
    metrics: [
      { id: 'clicks', label: 'クリック（すべて）' },
      { id: 'cpm', label: 'CPM（インプレッション単価）' },
      { id: 'ctr', label: 'CTR（すべて）' },
      { id: 'frequency', label: 'フリークエンシー' },
      { id: 'impressions', label: 'インプレッション' },
      { id: 'reach', label: 'リーチ' },
      { id: 'spend', label: '消化金額' },
      { id: 'cpc', label: 'CPC（リンクのクリック単価）' },
    ],
  },
  performance: {
    label: 'パフォーマンス',
    metrics: [
      { id: 'cost_per_unique_outbound_click', label: 'ユニークアウトバウンドクリックの単価' },
      { id: 'cost_per_thruplay', label: 'ThruPlayの単価' },
      { id: 'post_engagement', label: '投稿へのエンゲージメント' },
      // ... その他
    ],
  },
  conversion: {
    label: 'コンバージョン',
    metrics: [
      { id: 'actions_link_click', label: 'リンクのクリック' },
      { id: 'actions_landing_page_view', label: 'ランディングページビュー' },
      { id: 'website_registrations', label: 'ウェブサイトの登録完了' },
      // ... その他
    ],
  },
};
```

### メトリクス選択コンポーネント

```typescript
// src/components/crawler/steps/metrics-selector.tsx
'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Platform } from '@/types/platform';
import { getMetricsForPlatform } from '@/lib/platform-config';

interface MetricsSelectorProps {
  platform: Platform;
  selectedMetrics: string[];
  onChange: (metrics: string[]) => void;
}

export function MetricsSelector({
  platform,
  selectedMetrics,
  onChange,
}: MetricsSelectorProps) {
  const metricsConfig = getMetricsForPlatform(platform);

  const handleToggle = (id: string) => {
    if (selectedMetrics.includes(id)) {
      onChange(selectedMetrics.filter((m) => m !== id));
    } else {
      onChange([...selectedMetrics, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>メトリクス（指標）</Label>
        <Badge variant="outline">
          {selectedMetrics.length} 件選択中
        </Badge>
      </div>

      <Tabs defaultValue="common">
        <TabsList>
          {Object.entries(metricsConfig).map(([key, category]) => (
            <TabsTrigger key={key} value={key}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(metricsConfig).map(([key, category]) => (
          <TabsContent key={key} value={key}>
            <div className="grid gap-2 sm:grid-cols-2 mt-4">
              {category.metrics.map((metric) => (
                <label
                  key={metric.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedMetrics.includes(metric.id)}
                    onCheckedChange={() => handleToggle(metric.id)}
                  />
                  <span>{metric.label}</span>
                </label>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

## 完了条件

- [ ] カテゴリ別にメトリクスが表示される
- [ ] タブで切り替えできる
- [ ] 複数選択できる
- [ ] 選択数が表示される
- [ ] 選択状態が保存される

## 参考リソース

- [REQUIREMENTS.md - メトリクス](../../REQUIREMENTS.md)

