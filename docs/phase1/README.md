# Phase 1: 基盤構築

**期間**: Week 1-4  
**チケット数**: 13

## 概要

開発環境の構築、データベース設計、認証システム、基本レイアウトの実装を行う。

## Week 1-2: 環境・DB構築

| ID | チケット | 複雑度 | ステータス |
|----|----------|--------|-----------|
| [1-1](./1-1-nextjs-setup.md) | Next.js プロジェクト初期化 | Simple | ⬜ |
| [1-2](./1-2-docker-compose.md) | Docker Compose 作成 | Simple | ⬜ |
| [1-3](./1-3-shadcn-setup.md) | shadcn/ui セットアップ | Simple | ⬜ |
| [1-4](./1-4-ui-components.md) | 共通UIコンポーネント作成 | Medium | ⬜ |
| [1-5](./1-5-prisma-users.md) | Prisma スキーマ（users） | Simple | ⬜ |
| [1-6](./1-6-prisma-crawlers.md) | Prisma スキーマ（crawlers） | Simple | ⬜ |
| [1-7](./1-7-migration-seed.md) | マイグレーション・シード | Simple | ⬜ |

## Week 3-4: 認証・レイアウト

| ID | チケット | 複雑度 | ステータス |
|----|----------|--------|-----------|
| [2-1](./2-1-nextauth-setup.md) | NextAuth.js セットアップ | Simple | ⬜ |
| [2-2](./2-2-user-registration.md) | ユーザー登録API | Simple | ⬜ |
| [2-3](./2-3-auth-ui.md) | ログイン/サインアップ UI | Medium | ⬜ |
| [2-4](./2-4-auth-middleware.md) | 認証ミドルウェア | Simple | ⬜ |
| [2-5](./2-5-layout.md) | 共通レイアウト | Medium | ⬜ |
| [2-6](./2-6-user-menu.md) | ユーザーメニュー | Simple | ⬜ |

## 依存関係図

```
1-1 ──→ 1-3 ──→ 1-4 ──→ 2-3
  │              │       │
  │              └───────┴──→ 2-5 ──→ 2-6
  │
1-2 ──→ 1-5 ──→ 1-6 ──→ 1-7
          │
          └──→ 2-1 ──→ 2-2 ──→ 2-3
                │
                └──→ 2-4
```

## 完了条件

- [ ] Next.js プロジェクトが起動する
- [ ] Docker で PostgreSQL, Redis が起動する
- [ ] ユーザー登録・ログインができる
- [ ] 認証済みユーザーのみダッシュボードにアクセスできる
- [ ] 共通レイアウトが適用されている

