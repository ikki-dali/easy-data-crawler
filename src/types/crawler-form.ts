import { Platform } from './platform';
import { ReportConfig, ScheduleConfig } from './report';

export const CRAWLER_STEPS = [
  { id: 0, title: 'クローラー名', description: 'クローラーの名前を設定' },
  { id: 1, title: 'スプレッドシート', description: '出力先を設定' },
  { id: 2, title: 'プラットフォーム', description: 'データソースを選択' },
  { id: 3, title: 'アカウント', description: '広告アカウントを選択' },
  { id: 4, title: 'レポート設定', description: '取得するデータを設定' },
  { id: 5, title: '更新頻度', description: 'スケジュールとタグを設定' },
] as const;

export interface Sheet {
  sheetId: number;
  title: string;
}

export interface AdAccount {
  id: string;
  name: string;
}

export interface CrawlerFormData {
  // Step 0
  name: string;

  // Step 1
  spreadsheetUrl: string;
  spreadsheetId: string;
  sheetName: string;
  availableSheets: Sheet[];

  // Step 2
  platform: Platform | null;

  // Step 3
  accountIds: string[];
  availableAccounts: AdAccount[];

  // Step 4
  reportConfig: ReportConfig;

  // Step 5
  scheduleConfig: ScheduleConfig;
  tags: string[];
}

export const initialFormData: CrawlerFormData = {
  name: '',
  spreadsheetUrl: '',
  spreadsheetId: '',
  sheetName: '',
  availableSheets: [],
  platform: null,
  accountIds: [],
  availableAccounts: [],
  reportConfig: {
    dateRangeType: 'last_x_days_include',
    lookbackDays: 7,
    dimensions: ['date'],
    metrics: [],
    excludeZeroCost: false,
  },
  scheduleConfig: {
    frequency: 'daily',
    executionTime: '07:00',
    timezone: 'Asia/Tokyo',
  },
  tags: [],
};

