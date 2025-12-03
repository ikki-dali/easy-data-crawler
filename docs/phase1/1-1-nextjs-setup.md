# 1-1: Next.js プロジェクト初期化

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 1-1 |
| **複雑度** | Simple |
| **見積もり** | 2時間 |
| **依存** | なし |
| **ステータス** | ⬜ 未着手 |

## 説明

Next.js 14+ (App Router) プロジェクトを初期化し、TypeScript、Tailwind CSS、ESLint を設定する。

## タスク

- [ ] `create-next-app` でプロジェクト作成
- [ ] TypeScript 設定確認
- [ ] Tailwind CSS 設定
- [ ] ESLint + Prettier 設定
- [ ] 基本的なディレクトリ構造作成
- [ ] `.env.example` 作成

## 実装詳細

### プロジェクト作成コマンド

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### ディレクトリ構造

```
src/
├── app/
│   ├── (auth)/           # 認証関連ページ
│   ├── (dashboard)/      # ダッシュボード
│   ├── api/              # API Routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/               # shadcn/ui コンポーネント
│   ├── layout/           # レイアウトコンポーネント
│   └── crawler/          # クローラー関連
├── lib/
│   ├── utils.ts
│   └── db/
├── services/
├── types/
└── hooks/
```

### .env.example

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/datacrawler

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth (後で追加)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Meta OAuth (後で追加)
META_APP_ID=
META_APP_SECRET=
```

## 完了条件

- [ ] `npm run dev` でローカルサーバーが起動する
- [ ] TypeScript のエラーがない
- [ ] ESLint のエラーがない
- [ ] Tailwind CSS が適用される
- [ ] ディレクトリ構造が整っている

## 参考リソース

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Installation](https://tailwindcss.com/docs/installation)

