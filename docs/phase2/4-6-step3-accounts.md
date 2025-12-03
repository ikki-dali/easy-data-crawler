# 4-6: Step 3 - 広告アカウント選択UI

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 4-6 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 4-3, 4-5 |
| **ステータス** | ⬜ 未着手 |

## 説明

認証済みプラットフォームの広告アカウント一覧から、データ取得対象のアカウントを選択する。

## タスク

- [ ] アカウント一覧取得
- [ ] 複数選択UI（チェックボックス）
- [ ] 検索機能
- [ ] 全選択/全解除

## 実装詳細

### アカウント選択コンポーネント

```typescript
// src/components/crawler/steps/step-accounts.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface AdAccount {
  id: string;
  name: string;
}

interface StepAccountsProps {
  accounts: AdAccount[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  isLoading: boolean;
}

export function StepAccounts({
  accounts,
  selectedIds,
  onSelectionChange,
  isLoading,
}: StepAccountsProps) {
  const [search, setSearch] = useState('');

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(search.toLowerCase()) ||
    account.id.includes(search)
  );

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(filteredAccounts.map((a) => a.id));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="アカウント名またはIDで検索..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSelectAll}>
          全選択
        </Button>
        <Button variant="outline" size="sm" onClick={handleDeselectAll}>
          全解除
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {selectedIds.length} / {accounts.length} アカウントを選択中
      </p>

      <div className="max-h-[400px] overflow-y-auto border rounded-lg divide-y">
        {filteredAccounts.map((account) => (
          <label
            key={account.id}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
          >
            <Checkbox
              checked={selectedIds.includes(account.id)}
              onCheckedChange={() => handleToggle(account.id)}
            />
            <div className="flex-1">
              <p className="font-medium">{account.name}</p>
              <p className="text-xs text-muted-foreground">{account.id}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
```

## 完了条件

- [ ] アカウント一覧が表示される
- [ ] 複数のアカウントを選択できる
- [ ] 検索でフィルタリングできる
- [ ] 全選択/全解除が機能する
- [ ] 選択状態が保存される

## 参考リソース

- [REQUIREMENTS.md - Step 3](../../REQUIREMENTS.md)

