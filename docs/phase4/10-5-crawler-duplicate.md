# 10-5: クローラー複製機能

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 10-5 |
| **複雑度** | Simple |
| **見積もり** | 2時間 |
| **依存** | 10-4 |
| **ステータス** | ⬜ 未着手 |

## 説明

既存クローラーを複製して新しいクローラーを作成する機能を実装する。

## タスク

- [ ] 複製API (`POST /api/crawlers/[id]/duplicate`)
- [ ] 複製確認ダイアログ
- [ ] 複製後の名前設定

## 実装詳細

### 複製API

```typescript
// POST /api/crawlers/[id]/duplicate
interface DuplicateRequest {
  name?: string; // 新しい名前（省略時は "コピー ～ {元の名前}"）
}

interface DuplicateResponse {
  crawler: Crawler;
}
```

### 複製対象

- 名前（「コピー ～」を付与）
- プラットフォーム
- スプレッドシート設定
- 広告アカウント
- レポート設定
- スケジュール設定
- タグ

### 複製対象外

- ID（新規生成）
- ステータス（INACTIVE で作成）
- 実行履歴
- 作成日時

### ファイル構成

```
src/app/api/crawlers/[id]/duplicate/route.ts
```

## 完了条件

- [ ] 複製APIが動作する
- [ ] 複製後に詳細画面に遷移する
- [ ] 適切な名前が設定される

