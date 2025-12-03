# 2-5: 共通レイアウト

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 2-5 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 1-4 |
| **ステータス** | ⬜ 未着手 |

## 説明

ダッシュボードの共通レイアウト（ヘッダー、サイドバー）を作成する。

## タスク

- [ ] ヘッダーコンポーネント作成
- [ ] サイドバーコンポーネント作成
- [ ] ダッシュボードレイアウト作成
- [ ] レスポンシブ対応
- [ ] ナビゲーション設定

## 実装詳細

### ヘッダーコンポーネント

```typescript
// src/components/layout/header.tsx
'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from './user-menu';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* モバイルメニューボタン */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* ロゴ */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">
            カンタンデータクローラー
          </span>
        </div>

        {/* スペーサー */}
        <div className="flex-1" />

        {/* ユーザーメニュー */}
        <UserMenu />
      </div>
    </header>
  );
}
```

### サイドバーコンポーネント

```typescript
// src/components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Settings,
  History,
  HelpCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: 'ダッシュボード',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: '実行履歴',
    href: '/history',
    icon: History,
  },
  {
    name: '設定',
    href: '/settings',
    icon: Settings,
  },
  {
    name: 'ヘルプ',
    href: '/help',
    icon: HelpCircle,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* モバイルオーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 border-r bg-white transition-transform md:translate-x-0 md:pt-16',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* モバイル閉じるボタン */}
        <div className="flex h-16 items-center justify-between border-b px-4 md:hidden">
          <span className="text-lg font-bold text-primary">メニュー</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ナビゲーション */}
        <nav className="space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
```

### ダッシュボードレイアウト

```typescript
// src/app/(dashboard)/layout.tsx
'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* メインコンテンツ */}
      <main className="md:pl-64">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

### ページタイトルコンポーネント

```typescript
// src/components/layout/page-header.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
```

## 完了条件

- [ ] ヘッダーが表示される
- [ ] サイドバーが表示される
- [ ] ナビゲーションが機能する
- [ ] モバイルでハンバーガーメニューが機能する
- [ ] レスポンシブデザインが適用されている

## 参考リソース

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Lucide Icons](https://lucide.dev/)

