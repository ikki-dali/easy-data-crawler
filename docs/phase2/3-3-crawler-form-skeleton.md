# 3-3: クローラー作成フォーム骨格

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 3-3 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 3-2 |
| **ステータス** | ⬜ 未着手 |

## 説明

6ステップのクローラー作成フォームの骨格を作成する。ステップインジケーター、前へ/次へナビゲーション、状態管理を実装。

## タスク

- [ ] ステップインジケーターコンポーネント
- [ ] フォーム状態管理（Zustand or useState）
- [ ] ステップナビゲーション
- [ ] レイアウト作成
- [ ] 各ステップのプレースホルダー

## 実装詳細

### ステップ定義

```typescript
// src/types/crawler-form.ts
export const CRAWLER_STEPS = [
  { id: 0, title: 'クローラー名', description: 'クローラーの名前を設定' },
  { id: 1, title: 'スプレッドシート', description: '出力先を設定' },
  { id: 2, title: 'プラットフォーム', description: 'データソースを選択' },
  { id: 3, title: 'アカウント', description: '広告アカウントを選択' },
  { id: 4, title: 'レポート設定', description: '取得するデータを設定' },
  { id: 5, title: '更新頻度', description: 'スケジュールを設定' },
] as const;

export interface CrawlerFormData {
  // Step 0
  name: string;
  
  // Step 1
  spreadsheetUrl: string;
  spreadsheetId: string;
  sheetName: string;
  
  // Step 2
  platform: Platform | null;
  
  // Step 3
  accountIds: string[];
  
  // Step 4
  reportConfig: ReportConfig;
  
  // Step 5
  scheduleConfig: ScheduleConfig;
  tags: string[];
}
```

### ステップインジケーター

```typescript
// src/components/crawler/step-indicator.tsx
'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { CRAWLER_STEPS } from '@/types/crawler-form';

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
}

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center">
      {CRAWLER_STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium',
              currentStep === index
                ? 'border-primary bg-primary text-white'
                : completedSteps.includes(index)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-300 text-gray-500'
            )}
          >
            {completedSteps.includes(index) ? (
              <Check className="h-5 w-5" />
            ) : (
              index + 1
            )}
          </div>
          {index < CRAWLER_STEPS.length - 1 && (
            <div
              className={cn(
                'h-1 w-12 mx-2',
                completedSteps.includes(index) ? 'bg-primary' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

### フォームページ

```typescript
// src/app/(dashboard)/crawlers/new/page.tsx
'use client';

import { useState } from 'react';
import { StepIndicator } from '@/components/crawler/step-indicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CRAWLER_STEPS, CrawlerFormData } from '@/types/crawler-form';

const initialFormData: CrawlerFormData = {
  name: '',
  spreadsheetUrl: '',
  spreadsheetId: '',
  sheetName: '',
  platform: null,
  accountIds: [],
  reportConfig: {
    dateRangeType: 'last_x_days_include',
    lookbackDays: 7,
    dimensions: [],
    metrics: [],
    excludeZeroCost: false,
  },
  scheduleConfig: {
    frequency: 'daily',
    executionTime: '07:00',
    timezone: 'Asia/Tokyo',
  },
  tags: [],
};

export default function NewCrawlerPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<CrawlerFormData>(initialFormData);

  const handleNext = () => {
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    setCurrentStep((prev) => Math.min(prev + 1, CRAWLER_STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const step = CRAWLER_STEPS[currentStep];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">新規クローラー作成</h1>
      
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{step.title}</CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* ステップコンテンツ */}
          <div className="min-h-[300px]">
            {/* 各ステップのコンポーネントをここに */}
          </div>
          
          {/* ナビゲーション */}
          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              戻る
            </Button>
            <Button onClick={handleNext}>
              {currentStep === CRAWLER_STEPS.length - 1 ? '保存' : '次へ'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 完了条件

- [ ] /crawlers/new ページが表示される
- [ ] ステップインジケーターが機能する
- [ ] 前へ/次へボタンが機能する
- [ ] フォーム状態が保持される

## 参考リソース

- [React Hook Form Multi-step](https://react-hook-form.com/advanced-usage#WizardFormFunnel)

