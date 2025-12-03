# 10-2: 実行履歴一覧

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 10-2 |
| **複雑度** | Simple |
| **見積もり** | 2時間 |
| **依存** | 10-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

全クローラーの実行履歴を一覧表示する画面を実装する。

## タスク

- [ ] 実行履歴一覧API
- [ ] 実行履歴テーブルコンポーネント
- [ ] フィルター機能（ステータス、プラットフォーム、日付）
- [ ] ページネーション

## 実装詳細

### 実行履歴API

```typescript
// GET /api/executions
interface ExecutionListParams {
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  crawlerId?: string;
  platform?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface ExecutionListResponse {
  executions: JobExecution[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### UI構成

```
┌─────────────────────────────────────────────────┐
│ 実行履歴                                         │
├─────────────────────────────────────────────────┤
│ [ステータス▼] [プラットフォーム▼] [日付範囲]     │
├─────────────────────────────────────────────────┤
│ │ ステータス │ クローラー │ プラットフォーム │ 時刻 │
│ │───────────│───────────│─────────────────│─────│
│ │ ✅ 成功   │ Sample   │ Google Ads     │ 10:00│
│ │ ❌ 失敗   │ Test     │ Meta Ads       │ 09:30│
│ │ 🔄 実行中 │ Demo     │ TikTok Ads     │ 09:15│
├─────────────────────────────────────────────────┤
│ < 1 2 3 ... 10 >                                │
└─────────────────────────────────────────────────┘
```

### ファイル構成

```
src/
├── app/
│   ├── api/executions/route.ts
│   └── (dashboard)/executions/page.tsx
├── components/executions/
│   ├── execution-table.tsx
│   └── execution-filters.tsx
```

## 完了条件

- [ ] 実行履歴一覧が表示される
- [ ] フィルターが動作する
- [ ] ページネーションが動作する

