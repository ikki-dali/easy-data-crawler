'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PLATFORM_LIST } from '@/types/platform';
import { Search } from 'lucide-react';

interface CrawlerFiltersProps {
  filters: {
    platform: string;
    status: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export function CrawlerFilters({ filters, onFilterChange }: CrawlerFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="クローラー名で検索..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={filters.platform}
        onValueChange={(value) => onFilterChange('platform', value)}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="プラットフォーム" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          {PLATFORM_LIST.filter((p) => p.available).map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(value) => onFilterChange('status', value)}
      >
        <SelectTrigger className="sm:w-32">
          <SelectValue placeholder="ステータス" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="ACTIVE">アクティブ</SelectItem>
          <SelectItem value="INACTIVE">非アクティブ</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

