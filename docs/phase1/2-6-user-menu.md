# 2-6: ユーザーメニュー

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 2-6 |
| **複雑度** | Simple |
| **見積もり** | 1時間 |
| **依存** | 2-5, 2-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

ヘッダーに表示するユーザーメニュー（アバター、ドロップダウン、ログアウト）を作成する。

## タスク

- [ ] ユーザーメニューコンポーネント作成
- [ ] ドロップダウンメニュー実装
- [ ] ログアウト機能
- [ ] ユーザー情報表示

## 実装詳細

### ユーザーメニューコンポーネント

```typescript
// src/components/layout/user-menu.tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function UserMenu() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0]?.toUpperCase() || '?';

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || undefined} alt={user.name || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <User className="mr-2 h-4 w-4" />
          <span>プロフィール</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings/billing')}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>プラン・請求</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>設定</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>ログアウト</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### セッションプロバイダー設定

```typescript
// src/components/providers/session-provider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

interface Props {
  children: React.ReactNode;
}

export function AuthSessionProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### ルートレイアウトに追加

```typescript
// src/app/layout.tsx
import { AuthSessionProvider } from '@/components/providers/session-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
```

### Avatar コンポーネント追加

```bash
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
```

## 完了条件

- [ ] ユーザーメニューが表示される
- [ ] ユーザー名・メールアドレスが表示される
- [ ] ドロップダウンメニューが開く
- [ ] ログアウトが機能する
- [ ] 各メニューリンクが機能する

## 参考リソース

- [shadcn/ui Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu)
- [shadcn/ui Avatar](https://ui.shadcn.com/docs/components/avatar)
- [NextAuth.js useSession](https://next-auth.js.org/getting-started/client#usesession)

