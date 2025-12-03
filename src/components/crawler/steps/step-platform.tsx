'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PLATFORM_LIST, Platform } from '@/types/platform';
import { CheckCircle } from 'lucide-react';

interface StepPlatformProps {
  selectedPlatform: Platform | null;
  onSelect: (platform: Platform) => void;
  error?: string;
}

export function StepPlatform({ selectedPlatform, onSelect, error }: StepPlatformProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        データを取得するプラットフォームを選択してください
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_LIST.map((platform) => (
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
    </div>
  );
}

