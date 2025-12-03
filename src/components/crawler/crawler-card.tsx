'use client';

import Link from 'next/link';
import { ExternalLink, Copy, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PLATFORM_LIST } from '@/types/platform';
import { Crawler } from '@/types/crawler';

interface CrawlerCardProps {
  crawler: Crawler;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function CrawlerCard({ crawler, onDuplicate, onDelete }: CrawlerCardProps) {
  const platformInfo = PLATFORM_LIST.find((p) => p.id === crawler.platform);
  const platformLabel = platformInfo?.name || crawler.platform;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{crawler.name}</CardTitle>
            <CardDescription>{platformLabel}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={crawler.status === 'ACTIVE' ? 'success' : 'secondary'}
            >
              {crawler.status === 'ACTIVE' ? 'アクティブ' : '非アクティブ'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/crawlers/${crawler.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    編集
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  複製
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* タグ */}
          {crawler.tags && crawler.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {crawler.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* 最終実行日時 */}
          <p className="text-xs text-muted-foreground">
            最終実行:{' '}
            {crawler.lastExecutedAt
              ? new Date(crawler.lastExecutedAt).toLocaleString('ja-JP')
              : '未実行'}
          </p>

          {/* アクション */}
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={crawler.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                シート
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

