'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORM_LIST, Platform } from '@/types/platform';
import { CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface StepPlatformProps {
  selectedPlatform: Platform | null;
  onSelect: (platform: Platform) => void;
  error?: string;
}

export function StepPlatform({ selectedPlatform, onSelect, error }: StepPlatformProps) {
  // プラットフォームのトグル設定を取得
  const { data: platformSettings, isLoading } = useQuery<{ settings: Record<string, boolean> }>({
    queryKey: ['platform-settings-toggle'],
    queryFn: async () => {
      const res = await fetch('/api/settings/platforms/settings');
      if (!res.ok) return { settings: {} };
      return res.json();
    },
  });

  // 有効なプラットフォームだけをフィルタリング
  const enabledPlatforms = PLATFORM_LIST.filter((platform) => {
    // 設定がない場合はデフォルトで有効
    const isEnabled = platformSettings?.settings[platform.id] ?? true;
    return isEnabled;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          データを取得するプラットフォームを選択してください
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        データを取得するプラットフォームを選択してください
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {enabledPlatforms.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">
            有効なプラットフォームがありません。
            <br />
            設定画面でプラットフォームを有効にしてください。
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enabledPlatforms.map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={() => platform.available && onSelect(platform.id)}
              disabled={!platform.available}
              className={cn(
                'relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all',
                platform.available
                  ? 'hover:border-primary hover:bg-primary/5 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed',
                selectedPlatform === platform.id && 'border-primary bg-primary/10'
              )}
            >
              {selectedPlatform === platform.id && (
                <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{platform.name}</span>
                {platform.beta && (
                  <Badge variant="outline" className="text-xs">
                    β版
                  </Badge>
                )}
                {!platform.available && (
                  <Badge variant="secondary" className="text-xs">
                    開発中
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground">{platform.description}</p>

              {platform.requiresContact && (
                <p className="text-xs text-yellow-600">
                  ※営業担当への連絡が必要です
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
