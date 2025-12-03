'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, X, Info } from 'lucide-react';
import { ReportConfig, DateRangeType } from '@/types/report';
import { Platform } from '@/types/platform';

interface StepReportProps {
  platform: Platform;
  reportConfig: ReportConfig;
  onChange: (config: ReportConfig) => void;
  errors?: Record<string, string>;
}

const dateRangeOptions: { value: DateRangeType; label: string; description: string }[] = [
  { value: 'yesterday', label: '昨日', description: '昨日のデータのみ' },
  { value: 'last_x_days_include', label: '過去X日（今日含む）', description: '今日を含む過去のデータ' },
  { value: 'last_x_days_exclude', label: '過去X日（今日除く）', description: '今日を除く過去のデータ' },
  { value: 'this_month', label: '今月', description: '今月1日からのデータ' },
  { value: 'last_month', label: '先月', description: '先月のデータ' },
  { value: 'from_specific_to_today', label: '特定の日から今日まで', description: '指定した開始日から実行日までのデータ' },
];

// プラットフォームごとのディメンション
const dimensionsByPlatform: Record<string, { id: string; label: string }[]> = {
  default: [
    { id: 'date', label: '日付' },
    { id: 'campaign_id', label: 'キャンペーンID' },
    { id: 'campaign_name', label: 'キャンペーン名' },
    { id: 'ad_group_id', label: '広告グループID' },
    { id: 'ad_group_name', label: '広告グループ名' },
    { id: 'ad_id', label: '広告ID' },
    { id: 'ad_name', label: '広告名' },
  ],
  GOOGLE_ADS: [
    { id: 'date', label: '日付' },
    { id: 'campaign.id', label: 'キャンペーンID' },
    { id: 'campaign.name', label: 'キャンペーン名' },
    { id: 'ad_group.id', label: '広告グループID' },
    { id: 'ad_group.name', label: '広告グループ名' },
    { id: 'ad_group_ad.ad.id', label: '広告ID' },
    { id: 'device', label: 'デバイス' },
  ],
  META_ADS: [
    { id: 'date_start', label: '日付' },
    { id: 'campaign_id', label: 'キャンペーンID' },
    { id: 'campaign_name', label: 'キャンペーン名' },
    { id: 'adset_id', label: '広告セットID' },
    { id: 'adset_name', label: '広告セット名' },
    { id: 'ad_id', label: '広告ID' },
    { id: 'ad_name', label: '広告名' },
  ],
};

// プラットフォームごとのメトリクス
const metricsByPlatform: Record<string, { id: string; label: string }[]> = {
  default: [
    { id: 'impressions', label: 'インプレッション' },
    { id: 'clicks', label: 'クリック数' },
    { id: 'spend', label: '費用' },
    { id: 'conversions', label: 'コンバージョン' },
    { id: 'ctr', label: 'CTR' },
    { id: 'cpc', label: 'CPC' },
    { id: 'cpm', label: 'CPM' },
  ],
  GOOGLE_ADS: [
    { id: 'metrics.impressions', label: 'インプレッション' },
    { id: 'metrics.clicks', label: 'クリック数' },
    { id: 'metrics.cost_micros', label: '費用（マイクロ）' },
    { id: 'metrics.conversions', label: 'コンバージョン' },
    { id: 'metrics.ctr', label: 'CTR' },
    { id: 'metrics.average_cpc', label: '平均CPC' },
    { id: 'metrics.average_cpm', label: '平均CPM' },
    { id: 'metrics.video_views', label: '動画再生数' },
  ],
  META_ADS: [
    { id: 'impressions', label: 'インプレッション' },
    { id: 'clicks', label: 'クリック数' },
    { id: 'spend', label: '費用' },
    { id: 'reach', label: 'リーチ' },
    { id: 'frequency', label: 'フリークエンシー' },
    { id: 'ctr', label: 'CTR' },
    { id: 'cpc', label: 'CPC' },
    { id: 'cpm', label: 'CPM' },
    { id: 'video_p25_watched_actions', label: '動画25%再生' },
    { id: 'video_p50_watched_actions', label: '動画50%再生' },
    { id: 'video_p75_watched_actions', label: '動画75%再生' },
    { id: 'video_p100_watched_actions', label: '動画100%再生' },
  ],
};

export function StepReport({
  platform,
  reportConfig,
  onChange,
  errors,
}: StepReportProps) {
  const [customConversion, setCustomConversion] = useState('');
  const [customEvent, setCustomEvent] = useState('');

  const dimensions = dimensionsByPlatform[platform] || dimensionsByPlatform.default;
  const metrics = metricsByPlatform[platform] || metricsByPlatform.default;

  const handleDimensionToggle = (dimensionId: string) => {
    const newDimensions = reportConfig.dimensions.includes(dimensionId)
      ? reportConfig.dimensions.filter((d) => d !== dimensionId)
      : [...reportConfig.dimensions, dimensionId];
    onChange({ ...reportConfig, dimensions: newDimensions });
  };

  const handleMetricToggle = (metricId: string) => {
    const newMetrics = reportConfig.metrics.includes(metricId)
      ? reportConfig.metrics.filter((m) => m !== metricId)
      : [...reportConfig.metrics, metricId];
    onChange({ ...reportConfig, metrics: newMetrics });
  };

  const handleAddCustomConversion = () => {
    if (!customConversion.trim()) return;
    const newConversions = [...(reportConfig.customConversions || []), customConversion.trim()];
    onChange({ ...reportConfig, customConversions: newConversions });
    setCustomConversion('');
  };

  const handleRemoveCustomConversion = (index: number) => {
    const newConversions = reportConfig.customConversions?.filter((_, i) => i !== index) || [];
    onChange({ ...reportConfig, customConversions: newConversions });
  };

  const handleAddCustomEvent = () => {
    if (!customEvent.trim()) return;
    const newEvents = [...(reportConfig.customEvents || []), customEvent.trim()];
    onChange({ ...reportConfig, customEvents: newEvents });
    setCustomEvent('');
  };

  const handleRemoveCustomEvent = (index: number) => {
    const newEvents = reportConfig.customEvents?.filter((_, i) => i !== index) || [];
    onChange({ ...reportConfig, customEvents: newEvents });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="date" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="date">期間</TabsTrigger>
          <TabsTrigger value="dimensions">ディメンション</TabsTrigger>
          <TabsTrigger value="metrics">メトリクス</TabsTrigger>
          <TabsTrigger value="custom">カスタム</TabsTrigger>
        </TabsList>

        {/* 期間設定 */}
        <TabsContent value="date" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>期間タイプ</Label>
            <Select
              value={reportConfig.dateRangeType}
              onValueChange={(value: DateRangeType) =>
                onChange({ ...reportConfig, dateRangeType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div>{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(reportConfig.dateRangeType === 'last_x_days_include' ||
            reportConfig.dateRangeType === 'last_x_days_exclude') && (
            <div className="space-y-2">
              <Label htmlFor="lookbackDays">日数</Label>
              <Input
                id="lookbackDays"
                type="number"
                min={1}
                max={365}
                value={reportConfig.lookbackDays}
                onChange={(e) =>
                  onChange({
                    ...reportConfig,
                    lookbackDays: parseInt(e.target.value) || 7,
                  })
                }
              />
            </div>
          )}

          {reportConfig.dateRangeType === 'from_specific_to_today' && (
            <div className="space-y-2">
              <Label htmlFor="dateRangeStart">レポート期間の開始日を選択</Label>
              <Input
                id="dateRangeStart"
                type="date"
                value={reportConfig.dateRangeStart || ''}
                onChange={(e) =>
                  onChange({
                    ...reportConfig,
                    dateRangeStart: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                ※レポート期間の開始日は変更されず、クローラー実行日までのデータを取得します
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Checkbox
              id="excludeZeroCost"
              checked={reportConfig.excludeZeroCost}
              onCheckedChange={(checked) =>
                onChange({ ...reportConfig, excludeZeroCost: !!checked })
              }
            />
            <Label htmlFor="excludeZeroCost" className="cursor-pointer">
              費用が0の行を除外する
            </Label>
          </div>
        </TabsContent>

        {/* ディメンション選択 */}
        <TabsContent value="dimensions" className="space-y-4 mt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              レポートに含めるディメンション（分析軸）を選択してください。
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-2">
            {dimensions.map((dimension) => {
              const isSelected = reportConfig.dimensions.includes(dimension.id);
              return (
                <label
                  key={dimension.id}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleDimensionToggle(dimension.id)}
                  />
                  <span className="text-sm">{dimension.label}</span>
                </label>
              );
            })}
          </div>

          {reportConfig.dimensions.length > 0 && (
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium mb-2">選択中のディメンション:</div>
              <div className="flex flex-wrap gap-1">
                {reportConfig.dimensions.map((d) => {
                  const dim = dimensions.find((dim) => dim.id === d);
                  return (
                    <Badge key={d} variant="secondary">
                      {dim?.label || d}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* メトリクス選択 */}
        <TabsContent value="metrics" className="space-y-4 mt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              レポートに含める指標を選択してください。
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric) => {
              const isSelected = reportConfig.metrics.includes(metric.id);
              return (
                <label
                  key={metric.id}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleMetricToggle(metric.id)}
                  />
                  <span className="text-sm">{metric.label}</span>
                </label>
              );
            })}
          </div>

          {errors?.metrics && (
            <Alert variant="destructive">
              <AlertDescription>{errors.metrics}</AlertDescription>
            </Alert>
          )}

          {reportConfig.metrics.length > 0 && (
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium mb-2">選択中のメトリクス:</div>
              <div className="flex flex-wrap gap-1">
                {reportConfig.metrics.map((m) => {
                  const metric = metrics.find((met) => met.id === m);
                  return (
                    <Badge key={m} variant="secondary">
                      {metric?.label || m}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* カスタム設定 */}
        <TabsContent value="custom" className="space-y-6 mt-4">
          {/* カスタムコンバージョン */}
          <div className="space-y-3">
            <Label>カスタムコンバージョン</Label>
            <div className="flex gap-2">
              <Input
                placeholder="コンバージョン名を入力"
                value={customConversion}
                onChange={(e) => setCustomConversion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomConversion();
                  }
                }}
              />
              <Button onClick={handleAddCustomConversion} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {reportConfig.customConversions && reportConfig.customConversions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {reportConfig.customConversions.map((conv, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {conv}
                    <button
                      onClick={() => handleRemoveCustomConversion(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* カスタムイベント */}
          <div className="space-y-3">
            <Label>カスタムイベント</Label>
            <div className="flex gap-2">
              <Input
                placeholder="イベント名を入力"
                value={customEvent}
                onChange={(e) => setCustomEvent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomEvent();
                  }
                }}
              />
              <Button onClick={handleAddCustomEvent} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {reportConfig.customEvents && reportConfig.customEvents.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {reportConfig.customEvents.map((event, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {event}
                    <button
                      onClick={() => handleRemoveCustomEvent(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

