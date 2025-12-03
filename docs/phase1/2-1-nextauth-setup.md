# 2-1: NextAuth.js セットアップ

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 2-1 |
| **複雑度** | Simple |
| **見積もり** | 2時間 |
| **依存** | 1-5 |
| **ステータス** | ⬜ 未着手 |

## 説明

NextAuth.js をセットアップし、メール/パスワード認証の基盤を構築する。

## タスク

- [ ] NextAuth.js インストール
- [ ] Prisma Adapter 設定
- [ ] Credentials Provider 設定
- [ ] セッション設定
- [ ] 認証設定ファイル作成

## 実装詳細

### インストール

```bash
npm install next-auth @auth/prisma-adapter
```

### 認証設定

```typescript
// src/lib/auth/config.ts
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('メールアドレスとパスワードを入力してください');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('メールアドレスまたはパスワードが正しくありません');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('メールアドレスまたはパスワードが正しくありません');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
};
```

### API Route

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 型拡張

```typescript
// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
  }
}
```

### 環境変数

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here
```

## 完了条件

- [ ] NextAuth.js がインストールされている
- [ ] 認証設定ファイルが作成されている
- [ ] API Route が動作する
- [ ] 型定義が設定されている

## 参考リソース

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)

