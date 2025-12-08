'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Save, CheckCircle2, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// Meta広告のAPI設定
interface MetaApiConfig {
  appId: string;
  appSecret: string;
}

// プラットフォームのトグル設定
interface PlatformToggle {
  platform: string;
  label: string;
  description: string;
  enabled: boolean;
}

const platformToggles: Omit<PlatformToggle, 'enabled'>[] = [
  {
    platform: 'GOOGLE_ADS',
    label: 'Google Ads',
    description: 'Google 広告のレポートデータを取得します',
  },
  {
    platform: 'META_ADS',
    label: 'Meta Ads',
    description: 'Meta (Facebook/Instagram) 広告のレポートデータを取得します',
  },
  {
    platform: 'TIKTOK_ADS',
    label: 'TikTok Ads',
    description: 'TikTok 広告のレポートデータを取得します',
  },
  {
    platform: 'X_ADS',
    label: 'X (Twitter) Ads',
    description: 'X 広告のレポートデータを取得します',
  },
  {
    platform: 'LINE_ADS',
    label: 'LINE Ads',
    description: 'LINE 広告のレポートデータを取得します',
  },
];

export default function ApiKeysSettingsPage() {
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [metaConfig, setMetaConfig] = useState<MetaApiConfig>({ appId: '', appSecret: '' });

  // Meta広告のAPI設定を取得
  const { data: savedKeys, isLoading: isLoadingKeys } = useQuery<Record<string, Record<string, string>>>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/settings/api-keys');
      if (!res.ok) return {};
      return res.json();
    },
  });

  // プラットフォームのトグル設定を取得
  const { data: platformSettings, isLoading: isLoadingSettings } = useQuery<{ settings: Record<string, boolean> }>({
    queryKey: ['platform-settings-toggle'],
    queryFn: async () => {
      const res = await fetch('/api/settings/platforms/settings');
      if (!res.ok) return { settings: {} };
      return res.json();
    },
  });

  // 初期値をセット
  useEffect(() => {
    if (savedKeys?.META_ADS) {
      setMetaConfig({
        appId: savedKeys.META_ADS.appId || '',
        appSecret: savedKeys.META_ADS.appSecret || '',
      });
    }
  }, [savedKeys]);

  // Meta広告のAPI設定を保存
  const saveMetaMutation = useMutation({
    mutationFn: async (data: { platform: string; keys: Record<string, string> }) => {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('Meta広告のAPI設定を保存しました');
    },
    onError: () => {
      toast.error('保存に失敗しました');
    },
  });

  // プラットフォームのトグル設定を保存
  const togglePlatformMutation = useMutation({
    mutationFn: async (data: { platform: string; enabled: boolean }) => {
      const res = await fetch('/api/settings/platforms/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings-toggle'] });
    },
    onError: () => {
      toast.error('設定の更新に失敗しました');
    },
  });

  const handleSaveMeta = () => {
    saveMetaMutation.mutate({ platform: 'META_ADS', keys: metaConfig });
  };

  const handleTogglePlatform = (platform: string, enabled: boolean) => {
    togglePlatformMutation.mutate({ platform, enabled });
  };

  const toggleSecret = (fieldKey: string) => {
    setShowSecrets(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  // リダイレクトURIを取得
  const { data: redirectUris } = useQuery<{ 
    localhost: string; 
    production: string; 
    productionUrl: string;
    defaultProduction: string;
    defaultProductionUrl: string;
  }>({
    queryKey: ['redirect-uris'],
    queryFn: async () => {
      const res = await fetch('/api/settings/redirect-uri');
      if (!res.ok) {
        // フォールバック: デフォルト値
        const localhost = 'http://localhost:3000/api/platforms/meta/callback';
        const production = 'https://easy-data-crawler.vercel.app/api/platforms/meta/callback';
        return { 
          localhost, 
          production, 
          productionUrl: 'https://easy-data-crawler.vercel.app',
          defaultProduction: production,
          defaultProductionUrl: 'https://easy-data-crawler.vercel.app',
        };
      }
      return res.json();
    },
  });

  const getRedirectUri = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/platforms/meta/callback`;
  };

  const handleCopyRedirectUri = async (uri: string) => {
    try {
      await navigator.clipboard.writeText(uri);
      toast.success('リダイレクトURIをコピーしました');
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  const isMetaConfigured = savedKeys?.META_ADS?.appId && savedKeys?.META_ADS?.appSecret;
  const isLoading = isLoadingKeys || isLoadingSettings;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">プラットフォーム設定</h1>
        <p className="text-muted-foreground">
          使用するプラットフォームの有効/無効とAPI設定を管理します
        </p>
      </div>

      {/* プラットフォーム有効/無効設定 */}
      <Card>
        <CardHeader>
          <CardTitle>プラットフォームの有効/無効</CardTitle>
          <CardDescription>
            クローラー作成時に選択肢として表示するプラットフォームを設定します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformToggles.map((toggle) => {
              const isEnabled = platformSettings?.settings[toggle.platform] ?? true;
              return (
                <div
                  key={toggle.platform}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{toggle.label}</h3>
                      {isEnabled ? (
                        <Badge variant="default" className="bg-green-500 text-xs">有効</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">無効</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {toggle.description}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isEnabled}
                      onChange={(e) => handleTogglePlatform(toggle.platform, e.target.checked)}
                      disabled={togglePlatformMutation.isPending}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Meta広告のAPI設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Meta Ads API設定
                {isMetaConfigured && (
                  <Badge variant="default" className="bg-green-500">設定済み</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Meta (Facebook/Instagram) Marketing APIの認証情報を設定します
              </CardDescription>
            </div>
            <a
              href="https://developers.facebook.com/docs/marketing-apis/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              ドキュメント →
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Meta広告を利用するには、Facebook Developerコンソールでアプリを作成し、
              App IDとApp Secretを取得してください。
            </AlertDescription>
          </Alert>

          {/* リダイレクトURI設定 */}
          <div className="space-y-4">
            {/* 開発環境 */}
            <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">開発環境のリダイレクトURI</Label>
                  <p className="text-xs text-muted-foreground mt-1">localhost用</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyRedirectUri(redirectUris?.localhost || getRedirectUri())}
                  className="h-7 px-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  コピー
                </Button>
              </div>
              <div className="p-2 bg-background border rounded text-sm font-mono break-all">
                {redirectUris?.localhost || getRedirectUri()}
              </div>
            </div>

            {/* 本番環境 */}
            <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">本番環境のリダイレクトURI</Label>
                  <p className="text-xs text-muted-foreground mt-1">デプロイ版用</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyRedirectUri(redirectUris?.production || redirectUris?.defaultProduction || 'https://easy-data-crawler.vercel.app/api/platforms/meta/callback')}
                  className="h-7 px-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  コピー
                </Button>
              </div>
              <div className="p-2 bg-background border rounded text-sm font-mono break-all">
                {redirectUris?.production || redirectUris?.defaultProduction || 'https://easy-data-crawler.vercel.app/api/platforms/meta/callback'}
              </div>
            </div>
          </div>
            <Alert variant="default" className="py-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                <strong>Facebook Developer Consoleでの設定手順：</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Facebook Developer Console
                    </a>
                    にアクセス
                  </li>
                  <li>アプリを選択（または新規作成）</li>
                  <li>
                    <strong>商品</strong> → <strong>Facebookログイン</strong> → <strong>設定</strong> に移動
                  </li>
                  <li>
                    <strong>有効なOAuthリダイレクトURI</strong> に本番環境のURIを追加：
                    <br />
                    <code className="bg-muted px-1 rounded text-xs block mt-1">{redirectUris?.production || redirectUris?.defaultProduction || 'https://easy-data-crawler.vercel.app/api/platforms/meta/callback'}</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      ※ 開発環境（localhost）は自動的に許可されるため、追加不要です
                    </p>
                  </li>
                  <li>
                    <strong>変更を保存</strong> をクリック
                  </li>
                </ol>
                <div className="mt-2">
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Facebook Developer Consoleを開く
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-app-id">
              App ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="meta-app-id"
              placeholder="1234567890"
              value={metaConfig.appId}
              onChange={(e) => setMetaConfig(prev => ({ ...prev, appId: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-app-secret">
              App Secret <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="meta-app-secret"
                type={showSecrets['meta-app-secret'] ? 'text' : 'password'}
                placeholder="xxxxxxxx"
                value={metaConfig.appSecret}
                onChange={(e) => setMetaConfig(prev => ({ ...prev, appSecret: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => toggleSecret('meta-app-secret')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecrets['meta-app-secret'] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={handleSaveMeta}
            disabled={saveMetaMutation.isPending || !metaConfig.appId || !metaConfig.appSecret}
            className="w-full"
          >
            {saveMetaMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            保存
          </Button>
        </CardContent>
      </Card>

      {/* 補足説明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            アカウント連携について
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            各プラットフォームとのアカウント連携は、クローラー作成時の「データソースを選択」ステップで
            「他のアカウントを追加」ボタンから行えます。
            <br /><br />
            ここでの設定は、クローラー作成時にどのプラットフォームを選択肢として表示するかを制御します。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
