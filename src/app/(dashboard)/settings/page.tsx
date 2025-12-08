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
import { CheckCircle2, Circle, ExternalLink, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface AccountDetail {
  id: string;
  accountIdentifier: string | null;
  accountName: string;
  connectedAt: string;
  updatedAt: string;
}

interface AccountInfo {
  id: string;
  accountIdentifier: string | null;
  displayName?: string;
  userName?: string | null;
  userEmail?: string | null;
  accountCount?: number; // グループ化されたアカウント数
  accountIds?: string[]; // すべてのアカウントID
  accountDetails?: AccountDetail[]; // グループ内の各アカウントの詳細情報
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
  const [disconnectTarget, setDisconnectTarget] = useState<{ platform: string; accountId: string; accountName: string; accountIds?: string[] } | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<{ platforms: PlatformStatus[] }>({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/platforms');
      if (!res.ok) throw new Error('Failed to fetch platforms');
      return res.json();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async ({ accountId, accountIds }: { accountId: string; accountIds?: string[] }) => {
      // グループ化されたアカウントの場合は、すべてのアカウントIDを削除
      const idsToDelete = accountIds && accountIds.length > 0 ? accountIds : [accountId];
      
      // すべてのアカウントを削除
      const deletePromises = idsToDelete.map(id => 
        fetch(`/api/settings/platforms/accounts/${id}`, { 
          method: 'DELETE' 
        })
      );
      
      const results = await Promise.all(deletePromises);
      const failed = results.find(res => !res.ok);
      
      if (failed) {
        throw new Error('Failed to disconnect');
      }
      
      return { success: true };
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
                            {platform.accounts.map((account) => {
                              // 表示テキストを決定（ユーザー名とメールアドレスのみ）
                              let displayText = account.displayName || account.accountIdentifier || 'アカウント';
                              if (account.userName && account.userEmail) {
                                displayText = `${account.userName} - ${account.userEmail}`;
                              } else if (account.userName) {
                                displayText = account.userName;
                              } else if (account.userEmail) {
                                displayText = account.userEmail;
                              }
                              
                              const isExpanded = expandedAccounts.has(account.id);
                              const hasMultipleAccounts = account.accountCount && account.accountCount > 1;
                              
                              return (
                                <div key={account.id} className="border rounded text-xs">
                                  {/* メイン行 */}
                                  <div className="flex items-center justify-between p-1.5 hover:bg-muted/50">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {hasMultipleAccounts && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0"
                                          onClick={() => {
                                            const newExpanded = new Set(expandedAccounts);
                                            if (isExpanded) {
                                              newExpanded.delete(account.id);
                                            } else {
                                              newExpanded.add(account.id);
                                            }
                                            setExpandedAccounts(newExpanded);
                                          }}
                                        >
                                          {isExpanded ? (
                                            <ChevronUp className="h-3 w-3" />
                                          ) : (
                                            <ChevronDown className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}
                                      <span className="font-medium truncate text-xs">
                                        {displayText}
                                      </span>
                                      {hasMultipleAccounts && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                          {account.accountCount}
                                        </Badge>
                                      )}
                                      <span className="text-muted-foreground text-[10px]">
                                        {formatDistanceToNow(new Date(account.connectedAt), {
                                          addSuffix: true,
                                          locale: ja,
                                        })}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 flex-shrink-0"
                                      onClick={() =>
                                        setDisconnectTarget({
                                          platform: platform.platform,
                                          accountId: account.id,
                                          accountName: displayText,
                                          accountIds: account.accountIds,
                                        })
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  {/* 展開されたアカウント詳細 */}
                                  {isExpanded && account.accountDetails && account.accountDetails.length > 0 && (
                                    <div className="border-t bg-background/50 pl-6 pr-2 py-1 space-y-0.5">
                                      {account.accountDetails.map((detail) => (
                                        <div
                                          key={detail.id}
                                          className="flex items-center justify-between py-0.5 text-[10px]"
                                        >
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="truncate">{detail.accountName}</span>
                                            <span className="text-muted-foreground">
                                              {detail.accountIdentifier}
                                            </span>
                                          </div>
                                          <span className="text-muted-foreground text-[9px]">
                                            {formatDistanceToNow(new Date(detail.connectedAt), {
                                              addSuffix: true,
                                              locale: ja,
                                            })}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
                disconnectTarget && disconnectMutation.mutate({ 
                  accountId: disconnectTarget.accountId,
                  accountIds: disconnectTarget.accountIds
                })
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

