'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformApiConfig {
  platform: string;
  label: string;
  description: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
    required: boolean;
  }[];
  docsUrl: string;
}

const platformConfigs: PlatformApiConfig[] = [
  {
    platform: 'GOOGLE_ADS',
    label: 'Google Ads',
    description: 'Google Ads APIを使用するための認証情報',
    docsUrl: 'https://developers.google.com/google-ads/api/docs/first-call/overview',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'xxxx.apps.googleusercontent.com', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'GOCSPX-xxxx', required: true },
      { key: 'developerToken', label: 'Developer Token', type: 'password', placeholder: 'xxxx', required: true },
      { key: 'loginCustomerId', label: 'Login Customer ID (MCC)', type: 'text', placeholder: '123-456-7890', required: false },
    ],
  },
  {
    platform: 'META_ADS',
    label: 'Meta Ads',
    description: 'Meta (Facebook/Instagram) Marketing APIの認証情報',
    docsUrl: 'https://developers.facebook.com/docs/marketing-apis/',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', placeholder: '1234567890', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', placeholder: 'xxxx', required: true },
    ],
  },
  {
    platform: 'TIKTOK_ADS',
    label: 'TikTok Ads',
    description: 'TikTok Marketing APIの認証情報',
    docsUrl: 'https://business-api.tiktok.com/portal/docs',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', placeholder: '1234567890', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', placeholder: 'xxxx', required: true },
    ],
  },
  {
    platform: 'X_ADS',
    label: 'X (Twitter) Ads',
    description: 'X Ads APIの認証情報',
    docsUrl: 'https://developer.x.com/en/docs/x-ads-api',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'xxxx', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'xxxx', required: true },
      { key: 'bearerToken', label: 'Bearer Token', type: 'password', placeholder: 'xxxx', required: false },
    ],
  },
  {
    platform: 'LINE_ADS',
    label: 'LINE Ads',
    description: 'LINE Ads APIの認証情報',
    docsUrl: 'https://developers.line.biz/ja/docs/',
    fields: [
      { key: 'channelId', label: 'Channel ID', type: 'text', placeholder: '1234567890', required: true },
      { key: 'channelSecret', label: 'Channel Secret', type: 'password', placeholder: 'xxxx', required: true },
    ],
  },
];

interface ApiKeysData {
  [platform: string]: {
    [key: string]: string;
  };
}

export default function ApiKeysSettingsPage() {
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<ApiKeysData>({});
  const [activeTab, setActiveTab] = useState('META_ADS');

  // 既存の設定を取得
  const { data: savedKeys, isLoading } = useQuery<ApiKeysData>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/settings/api-keys');
      if (!res.ok) return {};
      return res.json();
    },
  });

  // 初期値をセット
  useEffect(() => {
    if (savedKeys) {
      setFormData(savedKeys);
    }
  }, [savedKeys]);

  // 保存
  const saveMutation = useMutation({
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
      toast.success('API設定を保存しました');
    },
    onError: () => {
      toast.error('保存に失敗しました');
    },
  });

  const handleSave = (platform: string) => {
    const keys = formData[platform] || {};
    saveMutation.mutate({ platform, keys });
  };

  const toggleSecret = (fieldKey: string) => {
    setShowSecrets(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const updateField = (platform: string, key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [platform]: {
        ...(prev[platform] || {}),
        [key]: value,
      },
    }));
  };

  const isConfigured = (platform: string) => {
    const config = platformConfigs.find(p => p.platform === platform);
    const keys = savedKeys?.[platform] || {};
    return config?.fields.filter(f => f.required).every(f => keys[f.key]);
  };

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
        <h1 className="text-2xl font-bold">API設定</h1>
        <p className="text-muted-foreground">
          各広告プラットフォームのAPI認証情報を設定します
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          API認証情報は暗号化されて保存されます。各プラットフォームの開発者コンソールから取得してください。
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          {platformConfigs.map(config => (
            <TabsTrigger key={config.platform} value={config.platform} className="relative">
              {config.label}
              {isConfigured(config.platform) && (
                <CheckCircle2 className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {platformConfigs.map(config => (
          <TabsContent key={config.platform} value={config.platform}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.label}
                      {isConfigured(config.platform) && (
                        <Badge variant="default" className="bg-green-500">設定済み</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </div>
                  <a
                    href={config.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    ドキュメント →
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.fields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`${config.platform}-${field.key}`}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${config.platform}-${field.key}`}
                        type={field.type === 'password' && !showSecrets[`${config.platform}-${field.key}`] ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        value={formData[config.platform]?.[field.key] || ''}
                        onChange={(e) => updateField(config.platform, field.key, e.target.value)}
                      />
                      {field.type === 'password' && (
                        <button
                          type="button"
                          onClick={() => toggleSecret(`${config.platform}-${field.key}`)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSecrets[`${config.platform}-${field.key}`] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  onClick={() => handleSave(config.platform)}
                  disabled={saveMutation.isPending}
                  className="w-full"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

