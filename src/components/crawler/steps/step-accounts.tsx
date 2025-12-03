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
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Building2,
  Plus,
} from 'lucide-react';
import { Platform } from '@/types/platform';

interface AdAccount {
  id: string;
  name: string;
  currency?: string;
  email?: string;
  accountIdentifier?: string;
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
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

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
    } catch {
      setAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [config.accountsUrl]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (status?.authenticated) {
      loadAccounts();
    }
  }, [status?.authenticated, loadAccounts]);

  const handleConnect = () => {
    const returnTo = encodeURIComponent('/crawlers/new?step=3');
    window.location.href = `${config.authorizeUrl}?returnTo=${returnTo}`;
  };

  const handleAddAccount = () => {
    const returnTo = encodeURIComponent('/crawlers/new?step=3');
    const authUrl = `${config.authorizeUrl}?returnTo=${returnTo}`;
    
    // ポップアップウィンドウでOAuth認証を開く
    const popup = window.open(
      authUrl,
      'oauth_popup',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // ポップアップが閉じられたか、認証が完了したかを監視
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        // アカウント一覧を再読み込み
        loadAccounts();
      }
    }, 500);

    // メッセージリスナーで認証完了を検知（callbackからpostMessageを送る）
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'oauth_success') {
        clearInterval(checkClosed);
        if (popup) popup.close();
        window.removeEventListener('message', handleMessage);
        loadAccounts();
      }
    };

    window.addEventListener('message', handleMessage);
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
        ) : accounts.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              広告アカウントが見つかりません。
              <br />
              アカウントの権限を確認してください。
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Select
              value={selectedAccountIds[0] || ''}
              onValueChange={(value) => {
                if (value) {
                  const account = accounts.find(a => a.id === value);
                  if (account) {
                    onAccountsChange([value], [account]);
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
                {accounts.map((account) => {
                  const displayText = account.email 
                    ? `${account.name} - ${account.email}`
                    : account.accountIdentifier
                    ? `${account.name} - ${account.accountIdentifier}`
                    : `${account.name} - ${account.id}`;
                  
                  return (
                    <SelectItem key={account.id} value={account.id}>
                      {displayText}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {/* 他のアカウントを追加ボタン */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 border-0"
              onClick={handleAddAccount}
            >
              <Plus className="h-4 w-4 mr-2" />
              他のアカウントを追加
            </Button>
          </>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 選択状態 */}
      {selectedAccountIds.length > 0 && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium">
              {accounts.find(a => a.id === selectedAccountIds[0])?.name || 'アカウント'} を選択中
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

