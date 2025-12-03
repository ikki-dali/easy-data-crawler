# 12-6: CI/CD (GitHub Actions)

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 12-6 |
| **複雑度** | Medium |
| **見積もり** | 4時間 |
| **依存** | 12-5 |
| **ステータス** | ⬜ 未着手 |

## 説明

GitHub Actions を使用した CI/CD パイプラインを構築する。

## タスク

- [ ] CI ワークフロー作成（lint, test, build）
- [ ] CD ワークフロー作成（デプロイ）
- [ ] キャッシュ設定
- [ ] シークレット設定

## 実装詳細

### CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:run

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

## 完了条件

- [ ] PRで自動テストが実行される
- [ ] mainブランチへのマージで自動デプロイ
- [ ] ビルドキャッシュが効いている

