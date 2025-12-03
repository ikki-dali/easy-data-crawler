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

