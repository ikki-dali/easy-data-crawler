'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ArrowLeft,
  Play,
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useState } from 'react';

interface CrawlerDetail {
  id: string;
  name: string;
  platform: string;
  status: 'ACTIVE' | 'INACTIVE';
  spreadsheetUrl: string;
  spreadsheetId: string;
  sheetName: string;
  accountIds: string[];
  reportConfig: {
    dateRangeType: string;
    lookbackDays?: number;
    dimensions: string[];
    metrics: string[];
    excludeZeroCost: boolean;
  };
  scheduleConfig: {
    frequency: string;
    executionTime?: string;
    timezone: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  jobExecutions: Array<{
    id: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    scheduledAt: string;
    completedAt?: string;
    errorMessage?: string;
  }>;
}

const platformLabels: Record<string, string> = {
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  TIKTOK_ADS: 'TikTok Ads',
  X_ADS: 'X Ads',
  LINE_ADS: 'LINE Ads',
};

const frequencyLabels: Record<string, string> = {
  hourly: '毎時',
  daily: '毎日',
  weekly: '毎週',
  monthly: '毎月',
};

const dateRangeLabels: Record<string, string> = {
  today: '今日',
  yesterday: '昨日',
  this_month: '今月',
  last_month: '先月',
  from_specific_to_today: '特定の日から今日まで',
  from_specific_to_yesterday: '特定の日から昨日まで',
  last_x_days_include: '過去X日（今日含む）',
  last_x_days_exclude: '過去X日（今日除く）',
  last_x_months: '過去Xヶ月',
  custom: 'カスタム',
};

const dimensionLabels: Record<string, string> = {
  date: '日付',
  date_start: '開始日',
  date_stop: '終了日',
  campaign_id: 'キャンペーンID',
  campaign_name: 'キャンペーン名',
  'campaign.id': 'キャンペーンID',
  'campaign.name': 'キャンペーン名',
  adset_id: '広告セットID',
  adset_name: '広告セット名',
  ad_group_id: '広告グループID',
  ad_group_name: '広告グループ名',
  'ad_group.id': '広告グループID',
  'ad_group.name': '広告グループ名',
  ad_id: '広告ID',
  ad_name: '広告名',
  'ad_group_ad.ad.id': '広告ID',
  device: 'デバイス',
};

const metricLabels: Record<string, string> = {
  impressions: 'インプレッション',
  clicks: 'クリック数',
  spend: '消化金額',
  reach: 'リーチ',
  frequency: 'フリークエンシー',
  ctr: 'CTR',
  cpc: 'CPC',
  cpm: 'CPM',
  conversions: 'コンバージョン',
  cost_per_conversion: 'コンバージョン単価',
  'metrics.impressions': 'インプレッション',
  'metrics.clicks': 'クリック数',
  'metrics.cost_micros': '費用',
  'metrics.conversions': 'コンバージョン',
  'metrics.ctr': 'CTR',
  'metrics.average_cpc': '平均CPC',
  'metrics.average_cpm': '平均CPM',
  'metrics.video_views': '動画再生数',
  video_p25_watched_actions: '動画25%再生',
  video_p50_watched_actions: '動画50%再生',
  video_p75_watched_actions: '動画75%再生',
  video_p100_watched_actions: '動画100%再生',
};

export default function CrawlerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const crawlerId = params.id as string;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: crawler, isLoading, error } = useQuery<CrawlerDetail>({
    queryKey: ['crawler', crawlerId],
    queryFn: async () => {
      const res = await fetch(`/api/crawlers/${crawlerId}`);
      if (!res.ok) throw new Error('Failed to fetch crawler');
      return res.json();
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crawlers/${crawlerId}/test`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to start test');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawler', crawlerId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crawlers/${crawlerId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      router.push('/');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crawlers/${crawlerId}/duplicate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to duplicate');
      return res.json();
    },
    onSuccess: (data) => {
      router.push(`/crawlers/${data.crawler.id}`);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const newStatus = crawler?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await fetch(`/api/crawlers/${crawlerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawler', crawlerId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !crawler) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">クローラーの取得に失敗しました</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{crawler.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={crawler.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {crawler.status === 'ACTIVE' ? '稼働中' : '停止中'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {platformLabels[crawler.platform] || crawler.platform}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => toggleStatusMutation.mutate()}
            disabled={toggleStatusMutation.isPending}
          >
            {crawler.status === 'ACTIVE' ? '停止' : '有効化'}
          </Button>
          <Button
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
          >
            {testMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            テスト実行
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/crawlers/${crawlerId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
          >
            <Copy className="mr-2 h-4 w-4" />
            複製
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">作成日</span>
              <span>{format(new Date(crawler.createdAt), 'yyyy/MM/dd HH:mm')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">最終更新</span>
              <span>
                {formatDistanceToNow(new Date(crawler.updatedAt), {
                  addSuffix: true,
                  locale: ja,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">最終実行</span>
              <span>
                {crawler.lastExecutedAt
                  ? formatDistanceToNow(new Date(crawler.lastExecutedAt), {
                      addSuffix: true,
                      locale: ja,
                    })
                  : '未実行'}
              </span>
            </div>
            {crawler.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {crawler.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 出力先 */}
        <Card>
          <CardHeader>
            <CardTitle>出力先</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">スプレッドシート</span>
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={crawler.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  開く
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">シート名</span>
              <p className="font-medium">{crawler.sheetName}</p>
            </div>
          </CardContent>
        </Card>

        {/* レポート設定 */}
        <Card>
          <CardHeader>
            <CardTitle>レポート設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">期間</span>
              <p className="font-medium">
                {dateRangeLabels[crawler.reportConfig.dateRangeType] || crawler.reportConfig.dateRangeType}
                {crawler.reportConfig.lookbackDays &&
                  ` (${crawler.reportConfig.lookbackDays}日)`}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">ディメンション</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {crawler.reportConfig.dimensions.map((dim) => (
                  <Badge key={dim} variant="secondary">
                    {dimensionLabels[dim] || dim}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">メトリクス</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {crawler.reportConfig.metrics.map((metric) => (
                  <Badge key={metric} variant="secondary">
                    {metricLabels[metric] || metric}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* スケジュール設定 */}
        <Card>
          <CardHeader>
            <CardTitle>スケジュール</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{frequencyLabels[crawler.scheduleConfig.frequency] || crawler.scheduleConfig.frequency}</span>
            </div>
            {crawler.scheduleConfig.executionTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{crawler.scheduleConfig.executionTime}</span>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              タイムゾーン: {crawler.scheduleConfig.timezone}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 実行履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の実行履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {crawler.jobExecutions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              まだ実行履歴がありません
            </p>
          ) : (
            <div className="space-y-2">
              {crawler.jobExecutions.map((exec) => (
                <div
                  key={exec.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {exec.status === 'COMPLETED' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : exec.status === 'FAILED' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : exec.status === 'RUNNING' ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium">
                        {format(new Date(exec.scheduledAt), 'yyyy/MM/dd HH:mm')}
                      </p>
                      {exec.errorMessage && (
                        <p className="text-sm text-red-500">{exec.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      exec.status === 'COMPLETED'
                        ? 'default'
                        : exec.status === 'FAILED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {exec.status === 'COMPLETED'
                      ? '成功'
                      : exec.status === 'FAILED'
                      ? '失敗'
                      : exec.status === 'RUNNING'
                      ? '実行中'
                      : '待機中'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>クローラーを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{crawler.name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
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

