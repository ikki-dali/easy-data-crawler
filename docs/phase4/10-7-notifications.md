# 10-7: 通知設定

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 10-7 |
| **複雑度** | Simple |
| **見積もり** | 2時間 |
| **依存** | 10-6 |
| **ステータス** | ⬜ 未着手 |

## 説明

実行結果の通知設定機能を実装する。（将来的な拡張用の基盤）

## タスク

- [ ] 通知設定スキーマ追加
- [ ] 通知設定UI
- [ ] メール通知設定
- [ ] Slack通知設定（オプション）

## 実装詳細

### 通知設定スキーマ

```prisma
model NotificationSettings {
  id        String   @id @default(cuid())
  userId    String   @unique
  
  emailEnabled     Boolean @default(true)
  emailOnSuccess   Boolean @default(false)
  emailOnFailure   Boolean @default(true)
  
  slackEnabled     Boolean @default(false)
  slackWebhookUrl  String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}
```

### UI構成

```
┌─────────────────────────────────────────────────┐
│ 通知設定                                         │
├─────────────────────────────────────────────────┤
│ メール通知                                       │
│ ┌─────────────────────────────────────────────┐│
│ │ [✓] メール通知を有効にする                   ││
│ │ [ ] 実行成功時も通知                         ││
│ │ [✓] 実行失敗時に通知                         ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Slack通知                                        │
│ ┌─────────────────────────────────────────────┐│
│ │ [ ] Slack通知を有効にする                    ││
│ │ Webhook URL: [________________]              ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [保存]                                          │
└─────────────────────────────────────────────────┘
```

### ファイル構成

```
src/
├── app/api/settings/notifications/route.ts
├── components/settings/notification-settings.tsx
```

## 完了条件

- [ ] 通知設定画面が表示される
- [ ] 設定を保存できる
- [ ] 通知が送信される（基盤のみ）

## 備考

実際の通知送信処理は Phase 5 で実装予定

