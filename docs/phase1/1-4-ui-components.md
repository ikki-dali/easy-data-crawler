# 1-4: 共通UIコンポーネント作成

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 1-4 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 1-3 |
| **ステータス** | ⬜ 未着手 |

## 説明

shadcn/ui から必要なコンポーネントを追加し、プロジェクト全体で使用する共通UIコンポーネントを整備する。

## タスク

- [ ] shadcn/ui コンポーネント追加
- [ ] カスタムコンポーネント作成（必要に応じて）
- [ ] コンポーネントのスタイル調整

## 実装詳細

### 追加するコンポーネント

```bash
# 基本コンポーネント
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form

# フォーム関連
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add textarea

# フィードバック
npx shadcn@latest add alert
npx shadcn@latest add badge
npx shadcn@latest add toast
npx shadcn@latest add skeleton

# ナビゲーション
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add dialog
npx shadcn@latest add sheet

# データ表示
npx shadcn@latest add table
npx shadcn@latest add avatar
npx shadcn@latest add separator
```

### 追加パッケージ

```bash
# フォーム管理
npm install react-hook-form @hookform/resolvers zod

# アイコン
npm install lucide-react

# 日付操作
npm install date-fns
```

### カスタムコンポーネント例

```typescript
// src/components/ui/status-badge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "error";
}

const statusConfig = {
  active: { label: "アクティブ", className: "bg-green-100 text-green-800" },
  inactive: { label: "非アクティブ", className: "bg-gray-100 text-gray-800" },
  pending: { label: "保留中", className: "bg-yellow-100 text-yellow-800" },
  error: { label: "エラー", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
```

## 完了条件

- [ ] すべての shadcn/ui コンポーネントがインストールされている
- [ ] カスタムコンポーネントが作成されている
- [ ] プライマリカラー（ピンク）が適用されている
- [ ] コンポーネントが正しく動作する

## 参考リソース

- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Lucide Icons](https://lucide.dev/)
- [React Hook Form](https://react-hook-form.com/)

