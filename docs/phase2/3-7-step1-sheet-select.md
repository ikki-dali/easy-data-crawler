# 3-7: Step 1 - シート選択

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 3-7 |
| **複雑度** | Simple |
| **見積もり** | 1時間 |
| **依存** | 3-6 |
| **ステータス** | ⬜ 未着手 |

## 説明

検証済みスプレッドシートのシート一覧から、データ出力先のシートを選択する。

## タスク

- [ ] シート一覧ドロップダウン
- [ ] シート選択
- [ ] 上書き警告表示

## 実装詳細

### シート選択コンポーネント

```typescript
// src/components/crawler/steps/sheet-selector.tsx
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Sheet {
  sheetId: number;
  title: string;
}

interface SheetSelectorProps {
  sheets: Sheet[];
  selectedSheet: string;
  onSelect: (sheetName: string) => void;
}

export function SheetSelector({ sheets, selectedSheet, onSelect }: SheetSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>出力先シート *</Label>
        <Select value={selectedSheet} onValueChange={onSelect}>
          <SelectTrigger>
            <SelectValue placeholder="シートを選択" />
          </SelectTrigger>
          <SelectContent>
            {sheets.map((sheet) => (
              <SelectItem key={sheet.sheetId} value={sheet.title}>
                {sheet.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSheet && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            選択したシートのデータは上書きされます。
            既存のデータは失われますのでご注意ください。
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

## 完了条件

- [ ] シート一覧が表示される
- [ ] シートを選択できる
- [ ] 上書き警告が表示される
- [ ] 選択値がフォーム状態に保存される

## 参考リソース

- [REQUIREMENTS.md - ステップ1](../../REQUIREMENTS.md)

