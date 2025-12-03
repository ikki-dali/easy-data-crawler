# 1-6: Prisma スキーマ（crawlers, job_executions）

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 1-6 |
| **複雑度** | Simple |
| **見積もり** | 1時間 |
| **依存** | 1-5 |
| **ステータス** | ⬜ 未着手 |

## 説明

クローラーとジョブ実行履歴のテーブルスキーマを定義する。

## タスク

- [ ] Crawler モデル定義
- [ ] JobExecution モデル定義
- [ ] インデックス設定
- [ ] リレーション確認

## 実装詳細

### prisma/schema.prisma に追加

```prisma
// クローラー
model Crawler {
  id              String   @id @default(cuid())
  userId          String
  name            String
  platform        Platform
  status          CrawlerStatus @default(INACTIVE)
  
  // スプレッドシート設定
  spreadsheetUrl  String
  spreadsheetId   String
  sheetName       String
  
  // データソース設定
  accountIds      String[] // 広告アカウントID配列
  
  // レポート設定（JSON）
  reportConfig    Json     // ReportConfig
  
  // スケジュール設定（JSON）
  scheduleConfig  Json     // ScheduleConfig
  
  // タグ
  tags            String[]
  
  // タイムスタンプ
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastExecutedAt  DateTime?
  
  // リレーション
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobExecutions   JobExecution[]
  
  @@index([userId])
  @@index([status])
  @@index([platform])
}

enum CrawlerStatus {
  ACTIVE
  INACTIVE
}

// ジョブ実行履歴
model JobExecution {
  id            String       @id @default(cuid())
  crawlerId     String
  status        JobStatus
  
  scheduledAt   DateTime
  startedAt     DateTime?
  completedAt   DateTime?
  
  errorMessage  String?      @db.Text
  retryCount    Int          @default(0)
  
  // 実行結果メタデータ（行数など）
  metadata      Json?
  
  createdAt     DateTime     @default(now())
  
  // リレーション
  crawler       Crawler      @relation(fields: [crawlerId], references: [id], onDelete: Cascade)
  
  @@index([crawlerId])
  @@index([status])
  @@index([scheduledAt])
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}
```

### ReportConfig 型定義

```typescript
// src/types/report.ts
export type DateRangeType =
  | 'today'
  | 'yesterday'
  | 'last_month'
  | 'from_specific_to_today'
  | 'from_specific_to_yesterday'
  | 'last_x_months'
  | 'last_x_months_current'
  | 'last_x_months_no_current'
  | 'last_x_days_include'
  | 'last_x_days_exclude'
  | 'custom';

export interface ReportConfig {
  dateRangeType: DateRangeType;
  dateRangeStart?: string; // 'YYYY-MM-DD'
  dateRangeEnd?: string;   // 'YYYY-MM-DD'
  lookbackDays?: number;
  lookbackMonths?: number;
  
  dimensions: string[];
  metrics: string[];
  
  customConversions?: {
    conversionId: string;
  }[];
  
  customEvents?: {
    eventName: string;
  }[];
  
  excludeZeroCost: boolean;
}

export interface ScheduleConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  executionTime?: string; // 'HH:mm'
  executionDay?: number;  // 1-7 (月-日)
  timezone: string;       // 'Asia/Tokyo'
}
```

## 完了条件

- [ ] Crawler モデルが定義されている
- [ ] JobExecution モデルが定義されている
- [ ] インデックスが設定されている
- [ ] TypeScript 型定義が作成されている
- [ ] スキーマがエラーなく検証される

## 参考リソース

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [REQUIREMENTS.md - データモデル](../REQUIREMENTS.md#22-クローラー管理機能)

