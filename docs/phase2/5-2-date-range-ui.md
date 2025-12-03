# 5-2: 期間設定UI

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 5-2 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 5-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

レポートの期間設定（今日、昨日、過去X日間、特定の日から等）のUIを作成する。

## タスク

- [ ] 期間タイプ選択UI
- [ ] 動的な追加入力（日数、開始日等）
- [ ] プレビュー表示

## 実装詳細

### 期間タイプ定義

```typescript
// src/types/report.ts
export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: '今日' },
  { value: 'yesterday', label: '昨日' },
  { value: 'last_month', label: '先月' },
  { value: 'from_specific_to_today', label: '特定の日から今日まで' },
  { value: 'from_specific_to_yesterday', label: '特定の日から昨日まで' },
  { value: 'last_x_months', label: '過去Xヶ月' },
  { value: 'last_x_months_current', label: '過去Xヶ月（当月を含む、本日を含む）' },
  { value: 'last_x_months_no_current', label: '過去Xヶ月（当月を含む、本日を含まない）' },
  { value: 'last_x_days_include', label: '過去X日間（本日を含む）' },
  { value: 'last_x_days_exclude', label: '過去X日間（本日を含まない）' },
  { value: 'custom', label: 'カスタム' },
] as const;
```

### 期間設定コンポーネント

```typescript
// src/components/crawler/steps/date-range-selector.tsx
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DATE_RANGE_OPTIONS, DateRangeType } from '@/types/report';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DateRangeSelectorProps {
  dateRangeType: DateRangeType;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  lookbackDays?: number;
  lookbackMonths?: number;
  onChange: (updates: Partial<DateRangeSelectorProps>) => void;
}

export function DateRangeSelector({
  dateRangeType,
  dateRangeStart,
  dateRangeEnd,
  lookbackDays,
  lookbackMonths,
  onChange,
}: DateRangeSelectorProps) {
  // プレビュー計算
  const getPreview = () => {
    const today = new Date();
    switch (dateRangeType) {
      case 'today':
        return format(today, 'yyyy/MM/dd', { locale: ja });
      case 'yesterday':
        return format(subDays(today, 1), 'yyyy/MM/dd', { locale: ja });
      case 'last_x_days_include':
        return `${format(subDays(today, (lookbackDays || 7) - 1), 'yyyy/MM/dd')} 〜 ${format(today, 'yyyy/MM/dd')}`;
      // ... 他のケース
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>レポート期間</Label>
        <Select
          value={dateRangeType}
          onValueChange={(value) => onChange({ dateRangeType: value as DateRangeType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 過去X日間の場合 */}
      {(dateRangeType === 'last_x_days_include' || dateRangeType === 'last_x_days_exclude') && (
        <div className="space-y-2">
          <Label>日数</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={lookbackDays || 7}
            onChange={(e) => onChange({ lookbackDays: parseInt(e.target.value) })}
          />
        </div>
      )}

      {/* 特定の日からの場合 */}
      {(dateRangeType === 'from_specific_to_today' || dateRangeType === 'from_specific_to_yesterday') && (
        <div className="space-y-2">
          <Label>開始日</Label>
          <Input
            type="date"
            value={dateRangeStart || ''}
            onChange={(e) => onChange({ dateRangeStart: e.target.value })}
          />
        </div>
      )}

      {/* プレビュー */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-muted-foreground">取得期間プレビュー</p>
        <p className="font-medium">{getPreview()}</p>
      </div>
    </div>
  );
}
```

## 完了条件

- [ ] 期間タイプを選択できる
- [ ] 追加入力（日数、開始日等）が表示される
- [ ] プレビューが表示される
- [ ] 設定が保存される

## 参考リソース

- [REQUIREMENTS.md - 期間設定](../../REQUIREMENTS.md)
- [date-fns](https://date-fns.org/)

