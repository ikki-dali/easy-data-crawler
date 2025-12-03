import { z } from 'zod';

// Step 0: クローラー名
export const crawlerNameSchema = z.object({
  name: z
    .string()
    .min(1, 'クローラー名を入力してください')
    .max(100, 'クローラー名は100文字以内で入力してください'),
});

// Step 1: スプレッドシート
export const spreadsheetSchema = z.object({
  spreadsheetUrl: z
    .string()
    .min(1, 'スプレッドシートURLを入力してください')
    .regex(
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      '有効なGoogleスプレッドシートURLを入力してください'
    ),
  sheetName: z.string().min(1, 'シートを選択してください'),
});

// クローラー作成スキーマ（全体）
export const createCrawlerSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum([
    'GOOGLE_ADS',
    'GOOGLE_ANALYTICS',
    'META_ADS',
    'TIKTOK_ADS',
    'LINE_ADS',
    'LINE_ADS_SYNC',
    'YAHOO_SEARCH',
    'YAHOO_DISPLAY',
    'SMARTNEWS_ADS',
    'SMARTNEWS_ADS_V2',
    'MICROSOFT_ADS',
    'X_ADS',
    'FACEBOOK_PAGE_INSIGHTS',
    'INSTAGRAM_INSIGHTS',
    'AMAZON_SELLER',
    'AD_EBIS',
    'GOOGLE_SHEETS',
  ]),
  spreadsheetUrl: z.string().url(),
  sheetName: z.string().min(1),
  accountIds: z.array(z.string()).min(1, '広告アカウントを選択してください'),
  reportConfig: z.object({
    dateRangeType: z.string(),
    dateRangeStart: z.string().optional(),
    dateRangeEnd: z.string().optional(),
    lookbackDays: z.number().optional(),
    lookbackMonths: z.number().optional(),
    dimensions: z.array(z.string()),
    metrics: z.array(z.string()).min(1, 'メトリクスを選択してください'),
    customConversions: z
      .array(
        z.object({
          conversionId: z.string(),
        })
      )
      .optional(),
    customEvents: z
      .array(
        z.object({
          eventName: z.string(),
        })
      )
      .optional(),
    excludeZeroCost: z.boolean(),
  }),
  scheduleConfig: z.object({
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
    executionTime: z.string().optional(),
    executionDay: z.number().optional(),
    timezone: z.string(),
  }),
  tags: z.array(z.string()).max(5).optional(),
});

export type CreateCrawlerInput = z.infer<typeof createCrawlerSchema>;

// ヘルパー関数
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

