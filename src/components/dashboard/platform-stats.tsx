'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface PlatformStat {
  platform: string;
  count: number;
  successRate: number;
}

interface PlatformStatsProps {
  stats: PlatformStat[];
  isLoading?: boolean;
}

const platformConfig: Record<string, { name: string; color: string }> = {
  GOOGLE_ADS: { name: 'Google Ads', color: 'bg-blue-500' },
  META_ADS: { name: 'Meta Ads', color: 'bg-indigo-500' },
  TIKTOK_ADS: { name: 'TikTok Ads', color: 'bg-pink-500' },
  X_ADS: { name: 'X Ads', color: 'bg-gray-800' },
  LINE_ADS: { name: 'LINE Ads', color: 'bg-green-500' },
  YAHOO_SEARCH: { name: 'Yahoo! Search', color: 'bg-red-500' },
  YAHOO_DISPLAY: { name: 'Yahoo! Display', color: 'bg-red-400' },
  MICROSOFT_ADS: { name: 'Microsoft Ads', color: 'bg-cyan-500' },
};

export function PlatformStats({ stats, isLoading }: PlatformStatsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>プラットフォーム別</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>プラットフォーム別</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            クローラーがありません
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = stats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>プラットフォーム別</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat) => {
            const config = platformConfig[stat.platform] || {
              name: stat.platform,
              color: 'bg-gray-500',
            };
            const percentage = total > 0 ? (stat.count / total) * 100 : 0;

            return (
              <div key={stat.platform} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span className="text-sm font-medium">{config.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{stat.count}</Badge>
                    <span className="text-xs text-muted-foreground">
                      成功率 {stat.successRate}%
                    </span>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

