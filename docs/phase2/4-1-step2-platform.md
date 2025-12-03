# 4-1: Step 2 - プラットフォーム選択UI

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 4-1 |
| **複雑度** | Simple |
| **見積もり** | 2時間 |
| **依存** | 3-4 |
| **ステータス** | ⬜ 未着手 |

## 説明

データソースとなる広告プラットフォームを選択するUIを作成する。

## タスク

- [ ] プラットフォーム一覧表示
- [ ] 選択UI（カード形式）
- [ ] β版・開発中の表示
- [ ] 選択状態の保存

## 実装詳細

### プラットフォーム選択コンポーネント

```typescript
// src/components/crawler/steps/step-platform.tsx
'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PLATFORM_LIST, Platform } from '@/types/platform';
import { CheckCircle } from 'lucide-react';

interface StepPlatformProps {
  selectedPlatform: Platform | null;
  onSelect: (platform: Platform) => void;
}

export function StepPlatform({ selectedPlatform, onSelect }: StepPlatformProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        データを取得するプラットフォームを選択してください
      </p>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_LIST.map((platform) => (
          <button
            key={platform.id}
            onClick={() => platform.available && onSelect(platform.id)}
            disabled={!platform.available}
            className={cn(
              'relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all',
              platform.available
                ? 'hover:border-primary hover:bg-primary/5 cursor-pointer'
                : 'opacity-50 cursor-not-allowed',
              selectedPlatform === platform.id && 'border-primary bg-primary/10'
            )}
          >
            {selectedPlatform === platform.id && (
              <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
            )}
            
            <div className="flex items-center gap-2">
              <span className="font-medium">{platform.name}</span>
              {platform.beta && (
                <Badge variant="outline" className="text-xs">β版</Badge>
              )}
              {!platform.available && (
                <Badge variant="secondary" className="text-xs">開発中</Badge>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {platform.description}
            </p>
            
            {platform.requiresContact && (
              <p className="text-xs text-yellow-600">
                ※営業担当への連絡が必要です
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## 完了条件

- [ ] プラットフォーム一覧が表示される
- [ ] 選択可能なプラットフォームをクリックできる
- [ ] 開発中のプラットフォームは選択できない
- [ ] β版の表示がある
- [ ] 選択状態が保存される

## 参考リソース

- [REQUIREMENTS.md - プラットフォーム一覧](../../REQUIREMENTS.md)

