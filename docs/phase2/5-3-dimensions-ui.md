# 5-3: ディメンション選択UI

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 5-3 |
| **複雑度** | Medium |
| **見積もり** | 2時間 |
| **依存** | 5-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

レポートのディメンション（分割単位）を選択するUIを作成する。プラットフォームごとに選択肢が異なる。

## タスク

- [ ] プラットフォーム別ディメンション定義
- [ ] 複数選択UI（チェックボックス）
- [ ] 選択順序の管理

## 実装詳細

### ディメンション定義

```typescript
// src/lib/platform-config/meta-ads.ts
export const META_ADS_DIMENSIONS = [
  { id: 'date', label: '日付', description: '日別のデータ' },
  { id: 'campaign_name', label: 'キャンペーン名', description: 'キャンペーン別' },
  { id: 'campaign_id', label: 'キャンペーンID', description: 'キャンペーンID別' },
  { id: 'adset_name', label: '広告セット名', description: '広告セット別' },
  { id: 'adset_id', label: '広告セットID', description: '広告セットID別' },
  { id: 'ad_name', label: '広告名', description: '広告別' },
  { id: 'ad_id', label: '広告ID', description: '広告ID別' },
  { id: 'platform_position', label: '配信', description: '配信面別' },
  { id: 'publisher_platform', label: 'プラットフォーム', description: 'Facebook/Instagram等' },
  { id: 'country', label: '国', description: '国別' },
  { id: 'gender', label: '性別', description: '性別' },
  { id: 'region', label: '地域', description: '地域別' },
  { id: 'age', label: '年齢', description: '年齢別' },
  { id: 'placement', label: '配置', description: '配置別' },
  { id: 'hourly_stats_aggregated_by_advertiser_time_zone', label: '時間帯', description: '時間帯別' },
];
```

### ディメンション選択コンポーネント

```typescript
// src/components/crawler/steps/dimensions-selector.tsx
'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Platform } from '@/types/platform';
import { getDimensionsForPlatform } from '@/lib/platform-config';

interface DimensionsSelectorProps {
  platform: Platform;
  selectedDimensions: string[];
  onChange: (dimensions: string[]) => void;
}

export function DimensionsSelector({
  platform,
  selectedDimensions,
  onChange,
}: DimensionsSelectorProps) {
  const dimensions = getDimensionsForPlatform(platform);

  const handleToggle = (id: string) => {
    if (selectedDimensions.includes(id)) {
      onChange(selectedDimensions.filter((d) => d !== id));
    } else {
      onChange([...selectedDimensions, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>ディメンション（分割単位）</Label>
        <Badge variant="outline">
          {selectedDimensions.length} 件選択中
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {dimensions.map((dim) => (
          <label
            key={dim.id}
            className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <Checkbox
              checked={selectedDimensions.includes(dim.id)}
              onCheckedChange={() => handleToggle(dim.id)}
            />
            <div className="flex-1">
              <p className="font-medium">{dim.label}</p>
              <p className="text-xs text-muted-foreground">{dim.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
```

## 完了条件

- [ ] プラットフォームに応じたディメンションが表示される
- [ ] 複数選択できる
- [ ] 選択数が表示される
- [ ] 選択状態が保存される

## 参考リソース

- [REQUIREMENTS.md - ディメンション](../../REQUIREMENTS.md)

