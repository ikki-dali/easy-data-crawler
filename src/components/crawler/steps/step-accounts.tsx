'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Building2,
  Plus,
} from 'lucide-react';
import { Platform } from '@/types/platform';
import { toast } from 'sonner';

interface AdAccount {
  id: string;
  name: string;
  currency?: string;
  email?: string;
  userName?: string;
  accountIdentifier?: string;
}

interface UserGroup {
  userId: string;
  userName: string;
  email: string;
  accounts: Array<{
    id: string;
    name: string;
    currency?: string;
    accountIdentifier?: string;
  }>;
}

interface PlatformStatus {
  authenticated: boolean;
  email?: string | null;
  accountId?: string | null;
}

interface StepAccountsProps {
  platform: Platform;
  selectedAccountIds: string[];
  onAccountsChange: (accountIds: string[], accounts: AdAccount[]) => void;
  error?: string;
}

const platformConfig: Record<Platform, {
  name: string;
  authorizeUrl: string;
  statusUrl: string;
  accountsUrl: string;
}> = {
  GOOGLE_ADS: {
    name: 'Google Ads',
    authorizeUrl: '/api/platforms/google-ads/authorize',
    statusUrl: '/api/platforms/google-ads/status',
    accountsUrl: '/api/platforms/google-ads/accounts',
  },
  META_ADS: {
    name: 'Meta (Facebook/Instagram)',
    authorizeUrl: '/api/platforms/meta/authorize',
    statusUrl: '/api/platforms/meta/status',
    accountsUrl: '/api/platforms/meta/accounts',
  },
  TIKTOK_ADS: {
    name: 'TikTok Ads',
    authorizeUrl: '/api/platforms/tiktok/authorize',
    statusUrl: '/api/platforms/tiktok/status',
    accountsUrl: '/api/platforms/tiktok/accounts',
  },
  LINE_ADS: {
    name: 'LINE Ads',
    authorizeUrl: '/api/platforms/line/authorize',
    statusUrl: '/api/platforms/line/status',
    accountsUrl: '/api/platforms/line/accounts',
  },
  X_ADS: {
    name: 'X (Twitter) Ads',
    authorizeUrl: '/api/platforms/x/authorize',
    statusUrl: '/api/platforms/x/status',
    accountsUrl: '/api/platforms/x/accounts',
  },
  // 以下は未実装のプラットフォーム
  GOOGLE_ANALYTICS: {
    name: 'Google Analytics',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  LINE_ADS_SYNC: {
    name: 'LINE Ads (Sync)',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  YAHOO_SEARCH: {
    name: 'Yahoo! Search',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  YAHOO_DISPLAY: {
    name: 'Yahoo! Display',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  SMARTNEWS_ADS: {
    name: 'SmartNews Ads',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  SMARTNEWS_ADS_V2: {
    name: 'SmartNews Ads V2',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  MICROSOFT_ADS: {
    name: 'Microsoft Ads',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  FACEBOOK_PAGE_INSIGHTS: {
    name: 'Facebook Page Insights',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  INSTAGRAM_INSIGHTS: {
    name: 'Instagram Insights',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  AMAZON_SELLER: {
    name: 'Amazon Seller',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  AD_EBIS: {
    name: 'AD EBiS',
    authorizeUrl: '#',
    statusUrl: '#',
    accountsUrl: '#',
  },
  GOOGLE_SHEETS: {
    name: 'Google Sheets',
    authorizeUrl: '/api/platforms/google-sheets/authorize',
    statusUrl: '/api/platforms/google-sheets/status',
    accountsUrl: '#',
  },
};

export function StepAccounts({
  platform,
  selectedAccountIds,
  onAccountsChange,
  error,
}: StepAccountsProps) {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAccounts, setModalAccounts] = useState<AdAccount[]>([]);
  const [modalUserGroups, setModalUserGroups] = useState<UserGroup[]>([]);
  const [isLoadingModalAccounts, setIsLoadingModalAccounts] = useState(false);
  const [modalPlatformStatus, setModalPlatformStatus] = useState<PlatformStatus | null>(null);
  const [isLoadingModalStatus, setIsLoadingModalStatus] = useState(false);

  const config = platformConfig[platform];

  const checkStatus = useCallback(async () => {
    if (config.statusUrl === '#') {
      setStatus({ authenticated: false });
      setIsLoadingStatus(false);
      return;
    }

    setIsLoadingStatus(true);
    try {
      const res = await fetch(config.statusUrl);
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ authenticated: false });
    } finally {
      setIsLoadingStatus(false);
    }
  }, [config.statusUrl]);

  const loadAccounts = useCallback(async () => {
    if (config.accountsUrl === '#') return;

    setIsLoadingAccounts(true);
    try {
      const res = await fetch(config.accountsUrl);
      const data = await res.json();
      setAccounts(data.accounts || []);
      // Meta Adsの場合はユーザーグループ化されたデータも使用
      if (platform === 'META_ADS' && data.groupedAccounts) {
        setUserGroups(data.groupedAccounts);
      } else {
        // 他のプラットフォームの場合は、アカウントからユーザーグループを作成
        const accounts = data.accounts || [];
        const groups = new Map<string, AdAccount[]>();
        for (const account of accounts) {
          const userKey = account.userName && account.email 
            ? `${account.userName}|||${account.email}`
            : account.email || account.userName || 'unknown';
          if (!groups.has(userKey)) {
            groups.set(userKey, []);
          }
          groups.get(userKey)!.push(account);
        }
        setUserGroups(Array.from(groups.entries()).map(([userId, accounts]) => {
          const firstAccount = accounts[0];
          return {
            userId,
            userName: firstAccount.userName || '',
            email: firstAccount.email || '',
            accounts: accounts.map(acc => ({
              id: acc.id,
              name: acc.name,
              currency: acc.currency,
              accountIdentifier: acc.accountIdentifier,
            })),
          };
        }));
      }
    } catch {
      setAccounts([]);
      setUserGroups([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [config.accountsUrl, platform]);

  const checkModalPlatformStatus = useCallback(async () => {
    if (config.statusUrl === '#') {
      setModalPlatformStatus({ authenticated: false });
      setIsLoadingModalStatus(false);
      return;
    }

    setIsLoadingModalStatus(true);
    try {
      const res = await fetch(config.statusUrl);
      const data = await res.json();
      setModalPlatformStatus(data);
    } catch {
      setModalPlatformStatus({ authenticated: false });
    } finally {
      setIsLoadingModalStatus(false);
    }
  }, [config.statusUrl]);

  const loadModalAccounts = useCallback(async () => {
    if (config.accountsUrl === '#') return;

    setIsLoadingModalAccounts(true);
    try {
      const res = await fetch(config.accountsUrl);
      const data = await res.json();
      setModalAccounts(data.accounts || []);
      // Meta Adsの場合はユーザーグループ化されたデータも使用
      if (platform === 'META_ADS' && data.groupedAccounts) {
        setModalUserGroups(data.groupedAccounts);
      } else {
        // 他のプラットフォームの場合は、アカウントからユーザーグループを作成
        const accounts = data.accounts || [];
        const groups = new Map<string, AdAccount[]>();
        for (const account of accounts) {
          const userKey = account.userName && account.email 
            ? `${account.userName}|||${account.email}`
            : account.email || account.userName || 'unknown';
          if (!groups.has(userKey)) {
            groups.set(userKey, []);
          }
          groups.get(userKey)!.push(account);
        }
        setModalUserGroups(Array.from(groups.entries()).map(([userId, accounts]) => {
          const firstAccount = accounts[0];
          return {
            userId,
            userName: firstAccount.userName || '',
            email: firstAccount.email || '',
            accounts: accounts.map(acc => ({
              id: acc.id,
              name: acc.name,
              currency: acc.currency,
              accountIdentifier: acc.accountIdentifier,
            })),
          };
        }));
      }
    } catch {
      setModalAccounts([]);
      setModalUserGroups([]);
    } finally {
      setIsLoadingModalAccounts(false);
    }
  }, [config.accountsUrl, platform]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (status?.authenticated) {
      loadAccounts();
    }
  }, [status?.authenticated, loadAccounts]);

  // OAuth完了を監視
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // セキュリティのため、originをチェック（開発環境では緩和）
      const isAllowedOrigin = 
        event.origin === window.location.origin || 
        event.origin.includes('localhost') ||
        event.origin.includes(window.location.hostname);
      
      if (!isAllowedOrigin) {
        console.warn('Message from unauthorized origin:', event.origin);
        return;
      }

      if (event.data && event.data.type === 'oauth_success') {
        console.log('OAuth success received:', event.data);
        
        // アカウント一覧を更新
        await loadAccounts();
        
        if (isModalOpen) {
          // 連携状態を再確認してからアカウントを読み込む
          await checkModalPlatformStatus();
          // 少し待ってからアカウントを読み込む（状態更新を待つ）
          setTimeout(() => {
            loadModalAccounts();
          }, 500);
        }
        
        // returnToが指定されている場合は、そのページにリダイレクト
        // ただし、現在のページが/crawlers/newの場合のみ（モーダルが開いている場合）
        if (event.data.returnTo && window.location.pathname === '/crawlers/new') {
          // 現在のURLパラメータを保持しつつ、returnToにリダイレクト
          const currentUrl = new URL(window.location.href);
          const returnUrl = new URL(event.data.returnTo, window.location.origin);
          
          // 現在のURLパラメータをreturnToに追加（stepなど）
          currentUrl.searchParams.forEach((value, key) => {
            if (key !== 'meta_connected') {
              returnUrl.searchParams.set(key, value);
            }
          });
          
          // meta_connectedパラメータを追加
          returnUrl.searchParams.set('meta_connected', 'true');
          
          console.log('Redirecting to:', returnUrl.toString());
          window.location.href = returnUrl.toString();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadAccounts, loadModalAccounts, isModalOpen, checkModalPlatformStatus]);

  // モーダルが開いたら連携状態を確認
  useEffect(() => {
    if (isModalOpen) {
      checkModalPlatformStatus();
    }
  }, [isModalOpen, checkModalPlatformStatus]);

  // 連携状態が確認できたらアカウントを読み込む
  useEffect(() => {
    if (isModalOpen && modalPlatformStatus?.authenticated) {
      loadModalAccounts();
    } else if (isModalOpen) {
      setModalAccounts([]);
      setModalUserGroups([]);
    }
  }, [isModalOpen, modalPlatformStatus?.authenticated, loadModalAccounts]);

  const handleConnect = () => {
    const returnTo = encodeURIComponent('/crawlers/new?step=3');
    window.location.href = `${config.authorizeUrl}?returnTo=${returnTo}`;
  };

  const handleConnectPlatform = (e?: React.MouseEvent) => {
    if (config.authorizeUrl === '#') return;
    
    // イベントをキャンセル（ポップアップブロッカー対策）
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const returnTo = encodeURIComponent('/crawlers/new?step=3&popup=true');
    const authUrl = `${config.authorizeUrl}?returnTo=${returnTo}`;
    
    console.log('Opening OAuth popup:', authUrl);
    
    // ポップアップウィンドウ（小窓）でOAuth認証を開く
    // ユーザーのクリックイベントから直接開くことでブロッカーを回避
    const popup = window.open(
      authUrl,
      'oauth_popup',
      'width=600,height=700,scrollbars=yes,resizable=yes,left=100,top=100'
    );

    // ポップアップがブロックされた場合のエラーハンドリング
    setTimeout(() => {
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.error('Popup blocked or failed to open');
        // ポップアップがブロックされた場合、新しいタブで開く（popup=trueを削除）
        toast.error('ポップアップがブロックされました。新しいタブで開きます。');
        const fallbackUrl = authUrl.replace(/[?&]popup=true/, '').replace(/popup=true[?&]/, '').replace(/popup=true$/, '');
        window.open(fallbackUrl, '_blank');
        return;
      }
      console.log('Popup opened successfully');
    }, 100);

    // ポップアップが閉じられたか、認証が完了したかを監視
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        // アカウント一覧を再読み込み
        setTimeout(() => {
          checkModalPlatformStatus();
        }, 1000);
      }
    }, 500);

    // メッセージリスナーで認証完了を検知（callbackからpostMessageを送る）
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data, 'from origin:', event.origin);
      
      // セキュリティのため、originをチェック（開発環境では緩和）
      // 同じorigin、またはlocalhostからのメッセージのみ受け付ける
      const isAllowedOrigin = 
        event.origin === window.location.origin || 
        event.origin.includes('localhost') ||
        event.origin.includes(window.location.hostname);
      
      if (!isAllowedOrigin) {
        console.warn('Message from unauthorized origin:', event.origin);
        return;
      }
      
      if (event.data && event.data.type === 'oauth_success') {
        console.log('OAuth success detected');
        clearInterval(checkClosed);
        if (popup) popup.close();
        window.removeEventListener('message', handleMessage);
        
        // アカウント一覧を更新
        loadAccounts();
        
        // 少し待ってから状態を更新
        setTimeout(() => {
          checkModalPlatformStatus();
          loadModalAccounts();
        }, 1000);
      } else if (event.data && event.data.type === 'oauth_error') {
        console.error('OAuth error:', event.data.error);
        clearInterval(checkClosed);
        if (popup) popup.close();
        window.removeEventListener('message', handleMessage);
        toast.error(`認証エラー: ${event.data.error}`);
      }
    };

    window.addEventListener('message', handleMessage);
  };

  const getAccountDisplayText = (account: AdAccount) => {
    if (account.userName && account.email) {
      return `${account.userName} - ${account.email}`;
    } else if (account.email) {
      return `${account.name} - ${account.email}`;
    } else if (account.userName) {
      return `${account.userName} - ${account.name}`;
    } else if (account.accountIdentifier) {
      return `${account.name} - ${account.accountIdentifier}`;
    }
    return account.name;
  };

  if (isLoadingStatus) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // 未実装のプラットフォーム
  if (config.authorizeUrl === '#') {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {config.name} の連携機能は現在開発中です。
            <br />
            仮のアカウントを設定して進むことができます。
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => {
            const demoAccounts = [
              { id: 'demo-1', name: 'デモアカウント 1' },
              { id: 'demo-2', name: 'デモアカウント 2' },
            ];
            setAccounts(demoAccounts);
            setStatus({ authenticated: true });
          }}
        >
          デモモードで続行
        </Button>
      </div>
    );
  }

  // 未認証の場合
  if (!status?.authenticated) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {config.name} と連携するにはアカウントの認証が必要です。
          </AlertDescription>
        </Alert>

        <div className="flex flex-col items-center gap-4 py-8">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-medium">{config.name} を連携</h3>
            <p className="text-sm text-muted-foreground mt-1">
              広告アカウントへのアクセス許可をお願いします
            </p>
          </div>
          <Button onClick={handleConnect} size="lg">
            {config.name} で認証する
          </Button>
        </div>
      </div>
    );
  }

  // 認証済みの場合
  // 選択されたユーザーグループを特定
  const selectedUserGroup = userGroups.find(group => 
    group.accounts.some(acc => selectedAccountIds.includes(acc.id))
  );
  const selectedAccount = accounts.find(a => a.id === selectedAccountIds[0]);

  // ユーザーグループの表示テキストを生成
  const getUserGroupDisplayText = (group: UserGroup) => {
    if (group.userName && group.email) {
      return `${group.userName} - ${group.email}`;
    } else if (group.email) {
      return group.email;
    } else if (group.userName) {
      return group.userName;
    }
    return '不明なユーザー';
  };

  return (
    <div className="space-y-6">
      {/* 連携状態 */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm">
            <span className="font-medium">{config.name}</span> 連携中
            {status.email && ` (${status.email})`}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={loadAccounts}>
          <RefreshCw className="h-4 w-4 mr-1" />
          更新
        </Button>
      </div>

      {/* アカウント選択 */}
      <div className="space-y-2">
        <h4 className="font-medium">アカウントを選択</h4>

        {isLoadingAccounts ? (
          <Skeleton className="h-10 w-full" />
        ) : userGroups.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              広告アカウントが見つかりません。
              <br />
              アカウントの権限を確認してください。
            </AlertDescription>
          </Alert>
        ) : (
          <Select
            value={selectedUserGroup?.userId || ''}
            onValueChange={(value) => {
              if (value) {
                const group = userGroups.find(g => g.userId === value);
                if (group) {
                  // そのユーザーのすべてのアカウントを選択
                  const allAccountIds = group.accounts.map(acc => acc.id);
                  const allAccounts = group.accounts.map(acc => {
                    const fullAccount = accounts.find(a => a.id === acc.id);
                    return fullAccount || {
                      id: acc.id,
                      name: acc.name,
                      currency: acc.currency,
                      email: group.email,
                      userName: group.userName,
                      accountIdentifier: acc.accountIdentifier,
                    };
                  });
                  onAccountsChange(allAccountIds, allAccounts);
                }
              } else {
                onAccountsChange([], []);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="アカウントを選択してください" />
            </SelectTrigger>
            <SelectContent>
              {userGroups.map((group) => (
                <SelectItem key={group.userId} value={group.userId}>
                  <span>
                    {getUserGroupDisplayText(group)}
                    {group.accounts.length > 1 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({group.accounts.length}アカウント)
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 他のアカウントを追加ボタン */}
      <Button
        type="button"
        variant="outline"
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 border-0"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        他のアカウントを追加
      </Button>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 選択状態 */}
      {selectedAccountIds.length > 0 && selectedUserGroup && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium">
              {getUserGroupDisplayText(selectedUserGroup)} を選択中
              {selectedAccountIds.length > 1 && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({selectedAccountIds.length}アカウント)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* アカウント追加モーダル */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setModalAccounts([]);
          setModalUserGroups([]);
          setModalPlatformStatus(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>アカウントを追加</DialogTitle>
            <DialogDescription>
              {config.name} のアカウントを連携・選択します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {isLoadingModalStatus ? (
              <Skeleton className="h-40 w-full" />
            ) : !modalPlatformStatus?.authenticated ? (
              // 未連携の場合
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {config.name} と連携するにはアカウントの認証が必要です。
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col items-center gap-4 py-6">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <h3 className="font-medium">{config.name} を連携</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      広告アカウントへのアクセス許可をお願いします
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 border-0"
                    onClick={(e) => handleConnectPlatform(e)}
                  >
                    {config.name} で認証する
                  </Button>
                </div>
              </div>
            ) : (
              // 連携済みの場合
              <div className="space-y-4">
                {/* 連携状態 */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm">
                      <span className="font-medium">{config.name}</span> 連携中
                      {modalPlatformStatus.email && ` (${modalPlatformStatus.email})`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      checkModalPlatformStatus();
                      loadModalAccounts();
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    更新
                  </Button>
                </div>

                {/* アカウント一覧 */}
                {isLoadingModalAccounts ? (
                  <Skeleton className="h-40 w-full" />
                ) : modalUserGroups.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      広告アカウントが見つかりません。
                      <br />
                      アカウントの権限を確認してください。
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">連携中のアカウント</h5>
                    {modalUserGroups.map((group) => {
                      const isSelected = group.accounts.some(acc => selectedAccountIds.includes(acc.id));
                      return (
                        <div
                          key={group.userId}
                          className={`p-3 border rounded-lg ${
                            isSelected ? 'border-primary bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {getUserGroupDisplayText(group)}
                                </span>
                                {isSelected && (
                                  <Badge variant="default" className="text-xs">
                                    選択中 ({group.accounts.length}アカウント)
                                  </Badge>
                                )}
                                {!isSelected && group.accounts.length > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    {group.accounts.length}アカウント
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (isSelected) {
                                  onAccountsChange([], []);
                                } else {
                                  // そのユーザーのすべてのアカウントを選択
                                  const allAccountIds = group.accounts.map(acc => acc.id);
                                  const allAccounts = group.accounts.map(acc => {
                                    const fullAccount = modalAccounts.find(a => a.id === acc.id);
                                    return fullAccount || {
                                      id: acc.id,
                                      name: acc.name,
                                      currency: acc.currency,
                                      email: group.email,
                                      userName: group.userName,
                                      accountIdentifier: acc.accountIdentifier,
                                    };
                                  });
                                  onAccountsChange(allAccountIds, allAccounts);
                                }
                              }}
                            >
                              {isSelected ? '選択解除' : '選択'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 border-0"
                          onClick={(e) => handleConnectPlatform(e)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          他のアカウントを追加
                        </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
