# 12-1: 環境変数管理・バリデーション

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 12-1 |
| **複雑度** | Simple |
| **見積もり** | 2時間 |
| **依存** | 11-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

環境変数のバリデーションとタイプセーフなアクセスを実装する。

## タスク

- [ ] Zod スキーマで環境変数を定義
- [ ] 起動時バリデーション
- [ ] 環境変数の型定義
- [ ] .env.example 更新

## 実装詳細

### 環境変数スキーマ

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // Auth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Google
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  
  // Encryption
  ENCRYPTION_KEY: z.string().length(64),
  
  // Optional platforms
  TIKTOK_APP_ID: z.string().optional(),
  TIKTOK_APP_SECRET: z.string().optional(),
  X_API_KEY: z.string().optional(),
  X_API_SECRET: z.string().optional(),
  LINE_CLIENT_ID: z.string().optional(),
  LINE_CLIENT_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

## 完了条件

- [ ] 必須環境変数が起動時にバリデートされる
- [ ] 型安全に環境変数にアクセスできる
- [ ] .env.example が最新

