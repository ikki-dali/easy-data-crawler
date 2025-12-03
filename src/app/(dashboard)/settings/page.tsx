'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { CheckCircle2, Circle, ExternalLink, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface AccountInfo {
  id: string;
  accountIdentifier: string | null;
  connectedAt: string;
  updatedAt: string;
}

interface PlatformStatus {
  platform: string;
  name: string;
  description: string;
  authenticated: boolean;
  accounts: AccountInfo[];
}

const authorizeUrls: Record<string, string> = {
  GOOGLE_SHEETS: '/api/platforms/google-sheets/authorize',
  GOOGLE_ADS: '/api/platforms/google-ads/authorize',
  META_ADS: '/api/platforms/meta/authorize',
  TIKTOK_ADS: '/api/platforms/tiktok/authorize',
  X_ADS: '/api/platforms/x/authorize',
  LINE_ADS: '/api/platforms/line/authorize',
};

const statusUrls: Record<string, string> = {
  GOOGLE_SHEETS: '/api/platforms/google-sheets/status',
  GOOGLE_ADS: '/api/platforms/google-ads/status',
  META_ADS: '/api/platforms/meta/status',
  TIKTOK_ADS: '/api/platforms/tiktok/status',
  X_ADS: '/api/platforms/x/status',
  LINE_ADS: '/api/platforms/line/status',
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [disconnectTarget, setDisconnectTarget] = useState<{ platform: string; accountId: string; accountName: string } | null>(null);

  const { data, isLoading } = useQuery<{ platforms: PlatformStatus[] }>({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/platforms');
      if (!res.ok) throw new Error('Failed to fetch platforms');
      return res.json();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async ({ accountId }: { accountId: string }) => {
      const res = await fetch(`/api/settings/platforms/accounts/${accountId}`, { 
        method: 'DELETE' 
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      setDisconnectTarget(null);
    },
  });

  const handleConnect = (platform: string) => {
    const url = authorizeUrls[platform];
    if (url) {
      const returnTo = encodeURIComponent('/settings');
      window.location.href = `${url}?returnTo=${returnTo}`;
    }
  };

  return (
    <div>
      <PageHeader
        title="設定"
        description="プラットフォーム連携とアカウント設定"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>プラットフォーム連携</CardTitle>
            <CardDescription>
              各広告プラットフォームとの連携状態を管理します
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data?.platforms.map((platform) => (
                  <div
                    key={platform.platform}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          platform.authenticated
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {platform.authenticated ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Circle className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{platform.name}</h3>
                          {platform.authenticated && (
                            <Badge variant="secondary" className="text-xs">
                              {platform.accounts.length}件連携中
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {platform.description}
                        </p>
                        {platform.authenticated && platform.accounts.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {platform.accounts.map((account) => (
                              <div
                                key={account.id}
                                className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                              >
                                <div>
                                  <span className="font-medium">
                                    {account.accountIdentifier || 'アカウント'}
                                  </span>
                                  <span className="text-muted-foreground ml-2">
                                    {formatDistanceToNow(new Date(account.connectedAt), {
                                      addSuffix: true,
                                      locale: ja,
                                    })}
                                    に連携
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={() =>
                                    setDisconnectTarget({
                                      platform: platform.platform,
                                      accountId: account.id,
                                      accountName: account.accountIdentifier || 'アカウント',
                                    })
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        variant={platform.authenticated ? 'outline' : 'default'}
                        onClick={() => handleConnect(platform.platform)}
                      >
                        {platform.authenticated ? '追加連携' : '連携する'}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 連携解除確認ダイアログ */}
      <AlertDialog
        open={!!disconnectTarget}
        onOpenChange={() => setDisconnectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>連携を解除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {disconnectTarget?.accountName} との連携を解除します。
              この操作を行うと、このアカウントを使用しているクローラーが
              正常に動作しなくなる可能性があります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                disconnectTarget && disconnectMutation.mutate({ accountId: disconnectTarget.accountId })
              }
              className="bg-red-600 hover:bg-red-700"
            >
              連携解除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

