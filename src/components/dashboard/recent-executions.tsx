'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Execution {
  id: string;
  crawlerId: string;
  crawlerName: string;
  platform: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  scheduledAt: string;
  completedAt?: string;
  errorMessage?: string;
}

interface RecentExecutionsProps {
  executions: Execution[];
  isLoading?: boolean;
}

const statusConfig = {
  PENDING: {
    icon: Clock,
    label: '待機中',
    variant: 'secondary' as const,
  },
  RUNNING: {
    icon: Loader2,
    label: '実行中',
    variant: 'default' as const,
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: '成功',
    variant: 'default' as const,
  },
  FAILED: {
    icon: XCircle,
    label: '失敗',
    variant: 'destructive' as const,
  },
};

const platformLabels: Record<string, string> = {
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  TIKTOK_ADS: 'TikTok Ads',
  X_ADS: 'X Ads',
  LINE_ADS: 'LINE Ads',
};

export function RecentExecutions({ executions, isLoading }: RecentExecutionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近の実行</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>最近の実行</CardTitle>
        <Link
          href="/executions"
          className="text-sm text-primary hover:underline"
        >
          すべて見る
        </Link>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            実行履歴がありません
          </p>
        ) : (
          <div className="space-y-4">
            {executions.map((execution) => {
              const config = statusConfig[execution.status];
              const Icon = config.icon;

              return (
                <Link
                  key={execution.id}
                  href={`/crawlers/${execution.crawlerId}`}
                  className="flex items-center gap-4 p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div
                    className={`p-2 rounded-full ${
                      execution.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-600'
                        : execution.status === 'FAILED'
                        ? 'bg-red-100 text-red-600'
                        : execution.status === 'RUNNING'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        execution.status === 'RUNNING' ? 'animate-spin' : ''
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{execution.crawlerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {platformLabels[execution.platform] || execution.platform}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={config.variant}>{config.label}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(execution.scheduledAt), {
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
  );
}

