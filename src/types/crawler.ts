import { Platform } from './platform';
import { ReportConfig, ScheduleConfig } from './report';

export type CrawlerStatus = 'ACTIVE' | 'INACTIVE';

export interface Crawler {
  id: string;
  userId: string;
  name: string;
  platform: Platform;
  status: CrawlerStatus;
  
  // スプレッドシート設定
  spreadsheetUrl: string;
  spreadsheetId: string;
  sheetName: string;
  
  // データソース設定
  accountIds: string[];
  
  // レポート設定
  reportConfig: ReportConfig;
  
  // スケジュール設定
  scheduleConfig: ScheduleConfig;
  
  // タグ
  tags: string[];
  
  // タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt: Date | null;
}

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface JobExecution {
  id: string;
  crawlerId: string;
  status: JobStatus;
  
  scheduledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  
  errorMessage: string | null;
  retryCount: number;
  
  metadata?: {
    rowCount?: number;
    duration?: number;
  };
  
  createdAt: Date;
}

export interface CreateCrawlerInput {
  name: string;
  platform: Platform;
  spreadsheetUrl: string;
  sheetName: string;
  accountIds: string[];
  reportConfig: ReportConfig;
  scheduleConfig: ScheduleConfig;
  tags?: string[];
}

export interface UpdateCrawlerInput {
  name?: string;
  status?: CrawlerStatus;
  spreadsheetUrl?: string;
  sheetName?: string;
  accountIds?: string[];
  reportConfig?: ReportConfig;
  scheduleConfig?: ScheduleConfig;
  tags?: string[];
}

