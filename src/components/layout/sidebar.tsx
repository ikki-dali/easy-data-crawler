'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Settings,
  History,
  X,
  Plus,
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
    href: '/executions',
    icon: History,
  },
  {
    name: '設定',
    href: '/settings',
    icon: Settings,
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
          'fixed left-0 top-0 z-50 h-full w-64 border-r bg-white transition-transform md:translate-x-0 md:top-16',
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

        {/* 新規クローラー作成ボタン */}
        <div className="p-4">
          <Button asChild className="w-full">
            <Link href="/crawlers/new" onClick={onClose}>
              <Plus className="mr-2 h-4 w-4" />
              新規クローラー作成
            </Link>
          </Button>
        </div>

        {/* ナビゲーション */}
        <nav className="space-y-1 px-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
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

