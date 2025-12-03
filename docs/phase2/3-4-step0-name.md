# 3-4: Step 0 - クローラー名入力

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 3-4 |
| **複雑度** | Simple |
| **見積もり** | 1時間 |
| **依存** | 3-3 |
| **ステータス** | ⬜ 未着手 |

## 説明

クローラー作成の最初のステップ。クローラー名を入力する。

## タスク

- [ ] クローラー名入力フォーム
- [ ] バリデーション（1-100文字、必須）
- [ ] エラー表示

## 実装詳細

### バリデーションスキーマ

```typescript
// src/lib/validations/crawler.ts
import { z } from 'zod';

export const crawlerNameSchema = z.object({
  name: z
    .string()
    .min(1, 'クローラー名を入力してください')
    .max(100, 'クローラー名は100文字以内で入力してください'),
});
```

### Step 0 コンポーネント

```typescript
// src/components/crawler/steps/step-name.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepNameProps {
  name: string;
  onChange: (name: string) => void;
  error?: string;
}

export function StepName({ name, onChange, error }: StepNameProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">クローラー名 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="例: Meta広告_日次レポート"
          maxLength={100}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <p className="text-sm text-muted-foreground">
        クローラーを識別するための名前を入力してください。後から変更できます。
      </p>
    </div>
  );
}
```

## 完了条件

- [ ] クローラー名を入力できる
- [ ] 空の場合にエラーが表示される
- [ ] 100文字を超える場合にエラーが表示される
- [ ] 入力値がフォーム状態に保存される

## 参考リソース

- [REQUIREMENTS.md - ステップ0](../../REQUIREMENTS.md)

