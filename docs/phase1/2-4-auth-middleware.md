# 2-4: 認証ミドルウェア

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 2-4 |
| **複雑度** | Simple |
| **見積もり** | 1時間 |
| **依存** | 2-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

認証ミドルウェアを作成し、保護されたルートへのアクセス制御を実装する。

## タスク

- [ ] Next.js ミドルウェア作成
- [ ] 保護ルート定義
- [ ] 未認証時のリダイレクト
- [ ] 認証済みユーザーのログインページリダイレクト

## 実装詳細

### ミドルウェア

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 認証が必要なパス
const protectedPaths = [
  '/',
  '/crawlers',
  '/settings',
];

// 認証済みユーザーがアクセスできないパス
const authPaths = [
  '/login',
  '/signup',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 静的ファイルとAPIは除外
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const isAuthPath = authPaths.includes(pathname);

  // 未認証で保護されたパスにアクセス → ログインへ
  if (!isAuthenticated && isProtectedPath) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // 認証済みで認証ページにアクセス → ダッシュボードへ
  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 認証ヘルパー関数

```typescript
// src/lib/auth/session.ts
import { getServerSession } from 'next-auth';
import { authOptions } from './config';
import { prisma } from '@/lib/db/prisma';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionType: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
```

### APIルート用認証チェック

```typescript
// src/lib/auth/api.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './config';

export async function withAuth<T>(
  handler: (userId: string) => Promise<T>
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  return handler(session.user.id);
}
```

### 使用例（APIルート）

```typescript
// src/app/api/crawlers/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  const crawlers = await prisma.crawler.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(crawlers);
}
```

## 完了条件

- [ ] 未認証ユーザーが保護ルートにアクセスするとログインへリダイレクトされる
- [ ] 認証済みユーザーがログインページにアクセスするとダッシュボードへリダイレクトされる
- [ ] callbackUrl が保持される
- [ ] ヘルパー関数が動作する

## 参考リソース

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [NextAuth.js getToken](https://next-auth.js.org/tutorials/securing-pages-and-api-routes)

