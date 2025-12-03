'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Database, Activity, CheckCircle2, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { CrawlerFilters } from '@/components/crawler/crawler-filters';
import { CrawlerCard } from '@/components/crawler/crawler-card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentExecutions } from '@/components/dashboard/recent-executions';
import { PlatformStats } from '@/components/dashboard/platform-stats';
import { useCrawlers, useDeleteCrawler, useDuplicateCrawler } from '@/hooks/use-crawlers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Crawler } from '@/types/crawler';

interface DashboardStats {
  totalCrawlers: number;
  activeCrawlers: number;
  totalExecutions: number;
  successRate: number;
  recentExecutions: Array<{
    id: string;
    crawlerId: string;
    crawlerName: string;
    platform: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    scheduledAt: string;
    completedAt?: string;
    errorMessage?: string;
  }>;
  platformStats: Array<{
    platform: string;
    count: number;
    successRate: number;
  }>;
}

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    platform: 'all',
    status: 'all',
    search: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<Crawler | null>(null);

  // ダッシュボード統計を取得
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 30000, // 30秒ごとに更新
  });

  const { data: crawlers, isLoading, error } = useCrawlers({
    platform: filters.platform === 'all' ? undefined : filters.platform,
    status: filters.status === 'all' ? undefined : filters.status,
    search: filters.search || undefined,
  });

  const deleteMutation = useDeleteCrawler();
  const duplicateMutation = useDuplicateCrawler();

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDuplicate = async (crawler: Crawler) => {
    try {
      await duplicateMutation.mutateAsync(crawler.id);
    } catch (error) {
      console.error('Duplicate error:', error);
    }
  };

  return (
    <div>
      <PageHeader
        title="ダッシュボード"
        description="クローラーの一覧と管理"
        actions={
          <Button asChild>
            <Link href="/crawlers/new">
              <Plus className="mr-2 h-4 w-4" />
              新規クローラー作成
            </Link>
          </Button>
        }
      />

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="クローラー数"
          value={stats?.totalCrawlers ?? 0}
          icon={Database}
          isLoading={statsLoading}
        />
        <StatsCard
          title="アクティブ"
          value={stats?.activeCrawlers ?? 0}
          description={`${stats?.totalCrawlers ? Math.round((stats.activeCrawlers / stats.totalCrawlers) * 100) : 0}% のクローラーが稼働中`}
          icon={Activity}
          isLoading={statsLoading}
        />
        <StatsCard
          title="実行回数"
          value={stats?.totalExecutions ?? 0}
          icon={BarChart3}
          isLoading={statsLoading}
        />
        <StatsCard
          title="成功率"
          value={`${stats?.successRate ?? 0}%`}
          icon={CheckCircle2}
          isLoading={statsLoading}
        />
      </div>

      {/* タブ切り替え */}
      <Tabs defaultValue="crawlers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="crawlers">クローラー一覧</TabsTrigger>
          <TabsTrigger value="activity">最近のアクティビティ</TabsTrigger>
        </TabsList>

        <TabsContent value="crawlers" className="space-y-4">
          {/* フィルター */}
          <CrawlerFilters filters={filters} onFilterChange={handleFilterChange} />

          {/* ローディング */}
          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-8 w-24" />
                </Card>
              ))}
            </div>
          )}

          {/* エラー */}
          {error && (
            <Card className="p-8 text-center">
              <p className="text-red-500">クローラーの取得に失敗しました</p>
            </Card>
          )}

          {/* クローラー一覧 */}
          {crawlers && crawlers.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {crawlers.map((crawler) => (
                <CrawlerCard
                  key={crawler.id}
                  crawler={crawler}
                  onDuplicate={() => handleDuplicate(crawler)}
                  onDelete={() => setDeleteTarget(crawler)}
                />
              ))}
            </div>
          )}

          {/* 空の状態 */}
          {crawlers && crawlers.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.platform !== 'all' || filters.status !== 'all'
                  ? '条件に一致するクローラーがありません'
                  : 'まだクローラーがありません'}
              </p>
              {!(filters.search || filters.platform !== 'all' || filters.status !== 'all') && (
                <Button asChild>
                  <Link href="/crawlers/new">
                    <Plus className="mr-2 h-4 w-4" />
                    最初のクローラーを作成
                  </Link>
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RecentExecutions
              executions={stats?.recentExecutions ?? []}
              isLoading={statsLoading}
            />
            <PlatformStats
              stats={stats?.platformStats ?? []}
              isLoading={statsLoading}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>クローラーを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
