# 11-1: 単体テストセットアップ

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 11-1 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | Phase 4 |
| **ステータス** | ⬜ 未着手 |

## 説明

Vitest を使用した単体テスト環境をセットアップする。

## タスク

- [ ] Vitest + Testing Library インストール
- [ ] テスト設定ファイル作成
- [ ] テストユーティリティ作成
- [ ] サンプルテスト作成
- [ ] npm scripts 追加

## 実装詳細

### インストール

```bash
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/jest-dom
```

### 設定ファイル

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### npm scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 完了条件

- [ ] Vitest が動作する
- [ ] サンプルテストが通る
- [ ] カバレッジレポートが生成される

