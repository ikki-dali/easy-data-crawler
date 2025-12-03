'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Execution {
  id: string;
  crawlerId: string;
  crawlerName: string;
  platform: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
}

interface ExecutionsResponse {
  executions: Execution[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const statusConfig = {
  PENDING: { icon: Clock, label: '待機中', color: 'bg-gray-100 text-gray-600' },
  RUNNING: { icon: Loader2, label: '実行中', color: 'bg-blue-100 text-blue-600' },
  COMPLETED: { icon: CheckCircle2, label: '成功', color: 'bg-green-100 text-green-600' },
  FAILED: { icon: XCircle, label: '失敗', color: 'bg-red-100 text-red-600' },
};

const platformLabels: Record<string, string> = {
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  TIKTOK_ADS: 'TikTok Ads',
  X_ADS: 'X Ads',
  LINE_ADS: 'LINE Ads',
};

export default function ExecutionsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const { data, isLoading } = useQuery<ExecutionsResponse>({
    queryKey: ['executions', page, statusFilter, platformFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(platformFilter !== 'all' && { platform: platformFilter }),
      });
      const res = await fetch(`/api/executions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch executions');
      return res.json();
    },
  });

  return (
    <div>
      <PageHeader
        title="実行履歴"
        description="クローラーの実行履歴を確認"
      />

      {/* フィルター */}
      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="COMPLETED">成功</SelectItem>
            <SelectItem value="FAILED">失敗</SelectItem>
            <SelectItem value="RUNNING">実行中</SelectItem>
            <SelectItem value="PENDING">待機中</SelectItem>
          </SelectContent>
        </Select>

        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="プラットフォーム" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
            <SelectItem value="META_ADS">Meta Ads</SelectItem>
            <SelectItem value="TIKTOK_ADS">TikTok Ads</SelectItem>
            <SelectItem value="X_ADS">X Ads</SelectItem>
            <SelectItem value="LINE_ADS">LINE Ads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* テーブル */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : data?.executions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              実行履歴がありません
            </div>
          ) : (
            <div className="divide-y">
              {data?.executions.map((exec) => {
                const config = statusConfig[exec.status];
                const Icon = config.icon;

                return (
                  <Link
                    key={exec.id}
                    href={`/crawlers/${exec.crawlerId}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${config.color}`}>
                      <Icon
                        className={`h-5 w-5 ${
                          exec.status === 'RUNNING' ? 'animate-spin' : ''
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{exec.crawlerName}</p>
                        <Badge variant="outline" className="text-xs">
                          {platformLabels[exec.platform] || exec.platform}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(exec.scheduledAt), 'yyyy/MM/dd HH:mm:ss')}
                        {exec.completedAt && (
                          <span className="ml-2">
                            (
                            {Math.round(
                              (new Date(exec.completedAt).getTime() -
                                new Date(exec.scheduledAt).getTime()) /
                                1000
                            )}
                            秒)
                          </span>
                        )}
                      </p>
                      {exec.errorMessage && (
                        <p className="text-sm text-red-500 truncate mt-1">
                          {exec.errorMessage}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          exec.status === 'COMPLETED'
                            ? 'default'
                            : exec.status === 'FAILED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {config.label}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(exec.scheduledAt), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ページネーション */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            全 {data.pagination.total} 件中 {(page - 1) * 20 + 1} -{' '}
            {Math.min(page * 20, data.pagination.total)} 件
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

