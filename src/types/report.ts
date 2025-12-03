export type DateRangeType =
  | 'today'
  | 'yesterday'
  | 'this_month'
  | 'last_month'
  | 'from_specific_to_today'
  | 'from_specific_to_yesterday'
  | 'last_x_months'
  | 'last_x_months_current'
  | 'last_x_months_no_current'
  | 'last_x_days_include'
  | 'last_x_days_exclude'
  | 'custom';

export interface ReportConfig {
  dateRangeType: DateRangeType;
  dateRangeStart?: string; // 'YYYY-MM-DD'
  dateRangeEnd?: string;   // 'YYYY-MM-DD'
  lookbackDays?: number;
  lookbackMonths?: number;
  
  dimensions: string[];
  metrics: string[];
  
  // カスタムコンバージョン名の配列
  customConversions?: string[];
  // カスタムイベント名の配列
  customEvents?: string[];
  
  excludeZeroCost: boolean;
}

export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface ScheduleConfig {
  frequency: ScheduleFrequency;
  executionTime?: string; // 'HH:mm'
  executionDay?: number;  // 1-7 (月-日)
  timezone: string;       // 'Asia/Tokyo'
}

