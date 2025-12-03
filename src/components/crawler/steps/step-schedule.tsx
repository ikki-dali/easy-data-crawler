'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, X } from 'lucide-react';
import { ScheduleConfig, ScheduleFrequency } from '@/types/report';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StepScheduleProps {
  scheduleConfig: ScheduleConfig;
  tags: string[];
  onScheduleChange: (config: ScheduleConfig) => void;
  onTagsChange: (tags: string[]) => void;
}

const FREQUENCY_OPTIONS: {
  value: ScheduleFrequency;
  label: string;
  minPlan: string;
}[] = [
  { value: 'daily', label: '毎日', minPlan: 'STARTER' },
  { value: 'weekly', label: '毎週', minPlan: 'STARTER' },
  { value: 'hourly', label: '毎時', minPlan: 'PRO' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: `${String(i).padStart(2, '0')}:00`,
  label: `${i}時`,
}));

export function StepSchedule({
  scheduleConfig,
  tags,
  onScheduleChange,
  onTagsChange,
}: StepScheduleProps) {
  const handleFrequencyChange = (frequency: ScheduleFrequency) => {
    onScheduleChange({ ...scheduleConfig, frequency });
  };

  const handleTimeChange = (executionTime: string) => {
    onScheduleChange({ ...scheduleConfig, executionTime });
  };

  const handleAddTag = (tag: string) => {
    if (tag && tags.length < 5 && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      {/* 更新頻度 */}
      <div className="space-y-2">
        <Label>更新頻度</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {FREQUENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleFrequencyChange(option.value)}
              className={cn(
                'p-4 border rounded-lg text-left transition-colors',
                scheduleConfig.frequency === option.value
                  ? 'border-primary bg-primary/10'
                  : 'hover:border-gray-400'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{option.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {option.minPlan}以上
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 実行時間 */}
      {scheduleConfig.frequency !== 'hourly' && (
        <div className="space-y-2">
          <Label>実行時間</Label>
          <Select
            value={scheduleConfig.executionTime}
            onValueChange={handleTimeChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* プレビュー */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {scheduleConfig.frequency === 'daily' && (
            <>毎日 {scheduleConfig.executionTime} に自動実行されます</>
          )}
          {scheduleConfig.frequency === 'weekly' && (
            <>毎週 {scheduleConfig.executionTime} に自動実行されます</>
          )}
          {scheduleConfig.frequency === 'hourly' && <>毎時自動実行されます</>}
        </AlertDescription>
      </Alert>

      {/* タグ */}
      <div className="space-y-2">
        <Label>タグ（最大5個）</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        {tags.length < 5 && (
          <Input
            placeholder="タグを入力してEnter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

