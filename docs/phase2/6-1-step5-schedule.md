# 6-1: Step 5 - スケジュール設定UI

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 6-1 |
| **複雑度** | Medium |
| **見積もり** | 2時間 |
| **依存** | 5-7 |
| **ステータス** | ⬜ 未着手 |

## 説明

クローラーの実行スケジュール（更新頻度、実行時間）を設定するUIを作成する。

## タスク

- [ ] 更新頻度選択（毎日、毎週、毎時）
- [ ] 実行時間選択
- [ ] プラン制限の表示
- [ ] プレビュー表示

## 実装詳細

### スケジュール設定コンポーネント

```typescript
// src/components/crawler/steps/step-schedule.tsx
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { ScheduleConfig, ScheduleFrequency } from '@/types/report';

interface StepScheduleProps {
  scheduleConfig: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
  userPlan: string;
}

const FREQUENCY_OPTIONS: { value: ScheduleFrequency; label: string; minPlan: string }[] = [
  { value: 'daily', label: '毎日', minPlan: 'STARTER' },
  { value: 'weekly', label: '毎週', minPlan: 'STARTER' },
  { value: 'hourly', label: '毎時', minPlan: 'PRO' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: `${String(i).padStart(2, '0')}:00`,
  label: `${i}時`,
}));

export function StepSchedule({ scheduleConfig, onChange, userPlan }: StepScheduleProps) {
  const handleFrequencyChange = (frequency: ScheduleFrequency) => {
    onChange({ ...scheduleConfig, frequency });
  };

  const handleTimeChange = (executionTime: string) => {
    onChange({ ...scheduleConfig, executionTime });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>更新頻度</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {FREQUENCY_OPTIONS.map((option) => {
            const isAvailable = userPlan >= option.minPlan;
            return (
              <button
                key={option.value}
                onClick={() => isAvailable && handleFrequencyChange(option.value)}
                disabled={!isAvailable}
                className={`p-4 border rounded-lg text-left ${
                  scheduleConfig.frequency === option.value
                    ? 'border-primary bg-primary/10'
                    : isAvailable
                    ? 'hover:border-gray-400'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.label}</span>
                  {!isAvailable && (
                    <Badge variant="secondary">{option.minPlan}以上</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {scheduleConfig.frequency !== 'hourly' && (
        <div className="space-y-2">
          <Label>実行時間</Label>
          <Select
            value={scheduleConfig.executionTime}
            onValueChange={handleTimeChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {scheduleConfig.frequency === 'daily' && (
            <>毎日 {scheduleConfig.executionTime} に自動実行されます</>
          )}
          {scheduleConfig.frequency === 'weekly' && (
            <>毎週 {scheduleConfig.executionTime} に自動実行されます</>
          )}
          {scheduleConfig.frequency === 'hourly' && (
            <>毎時自動実行されます</>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

## 完了条件

- [ ] 更新頻度を選択できる
- [ ] 実行時間を選択できる
- [ ] プランによる制限が表示される
- [ ] 設定が保存される

## 参考リソース

- [REQUIREMENTS.md - スケジュール設定](../../REQUIREMENTS.md)

