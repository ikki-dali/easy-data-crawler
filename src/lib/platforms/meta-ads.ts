import { prisma } from '@/lib/db/prisma';
import { decryptCredentials } from '@/lib/encryption';
import { CrawlerJobData } from '@/lib/queue/crawler-queue';

const META_GRAPH_URL = 'https://graph.facebook.com/v18.0';

interface MetaCredentials {
  accessToken: string;
  expiresAt?: number;
}

async function getValidCredentials(userId: string): Promise<MetaCredentials> {
  const auth = await prisma.platformAuthentication.findFirst({
    where: {
      userId,
      platform: 'META_ADS',
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!auth) {
    throw new Error('Meta認証が必要です');
  }

  const credentials = decryptCredentials(auth.encryptedCredentials);

  // トークンの有効期限をチェック
  if (credentials.expiresAt && credentials.expiresAt < Date.now()) {
    throw new Error('Metaトークンが期限切れです。再認証が必要です。');
  }

  return credentials;
}

function calculateDateRange(reportConfig: CrawlerJobData['reportConfig']): {
  since: string;
  until: string;
} {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  switch (reportConfig.dateRangeType) {
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { since: formatDate(yesterday), until: formatDate(yesterday) };
    }
    case 'last_x_days_include': {
      const days = reportConfig.lookbackDays || 7;
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - days + 1);
      return { since: formatDate(startDate), until: formatDate(today) };
    }
    case 'last_x_days_exclude': {
      const days = reportConfig.lookbackDays || 7;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const startDate = new Date(yesterday);
      startDate.setDate(startDate.getDate() - days + 1);
      return { since: formatDate(startDate), until: formatDate(yesterday) };
    }
    case 'this_month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { since: formatDate(startOfMonth), until: formatDate(today) };
    }
    case 'last_month': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { since: formatDate(startOfLastMonth), until: formatDate(endOfLastMonth) };
    }
    case 'from_specific_to_today': {
      // 特定の開始日から今日まで
      const startDate = reportConfig.dateRangeStart || formatDate(today);
      return { since: startDate, until: formatDate(today) };
    }
    case 'from_specific_to_yesterday': {
      // 特定の開始日から昨日まで
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const startDate = reportConfig.dateRangeStart || formatDate(yesterday);
      return { since: startDate, until: formatDate(yesterday) };
    }
    default: {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      return { since: formatDate(startDate), until: formatDate(today) };
    }
  }
}

function mapDimensionsToLevel(dimensions: string[]): string {
  // ディメンションに基づいてAPIのレベルを決定
  if (dimensions.some(d => d.includes('ad_id') || d.includes('ad_name'))) {
    return 'ad';
  }
  if (dimensions.some(d => d.includes('adset'))) {
    return 'adset';
  }
  return 'campaign';
}

function mapMetricsToFields(metrics: string[]): string[] {
  // Meta API用のフィールド名にマッピング
  const mapping: Record<string, string> = {
    'impressions': 'impressions',
    'clicks': 'clicks',
    'spend': 'spend',
    'reach': 'reach',
    'frequency': 'frequency',
    'ctr': 'ctr',
    'cpc': 'cpc',
    'cpm': 'cpm',
  };

  return metrics.map(m => mapping[m] || m).filter(Boolean);
}

export async function fetchMetaAdsData(
  jobData: CrawlerJobData
): Promise<Record<string, unknown>[]> {
  const { userId, accountIds, reportConfig, isTest } = jobData;

  // テスト実行でも実際のAPIを呼び出す（コメントアウトでダミーに戻せる）
  // if (isTest) {
  //   console.log('[Meta Ads] Test mode - returning dummy data');
  //   return generateDummyData(reportConfig.dimensions, reportConfig.metrics);
  // }
  console.log('[Meta Ads] Fetching real data from Meta API...');

  let credentials: MetaCredentials;
  try {
    credentials = await getValidCredentials(userId);
  } catch (error) {
    console.warn('[Meta Ads] Credentials not available, using demo mode');
    return generateDummyData(reportConfig.dimensions, reportConfig.metrics);
  }

  const dateRange = calculateDateRange(reportConfig);
  const level = mapDimensionsToLevel(reportConfig.dimensions);
  const fields = mapMetricsToFields(reportConfig.metrics);

  const allResults: Record<string, unknown>[] = [];

  // 各アカウントからデータを取得
  for (const accountId of accountIds) {
    try {
      // 必要なフィールドのみ（日付、キャンペーン名 + 選択したメトリクス）
      const baseFields = ['date_start', 'campaign_name'];
      const allFields = [...new Set([...baseFields, ...fields])];
      
      const params = new URLSearchParams({
        fields: allFields.join(','),
        level,
        time_range: JSON.stringify({
          since: dateRange.since,
          until: dateRange.until,
        }),
        time_increment: '1', // 日別
        access_token: credentials.accessToken,
        limit: '500',
      });

      const response = await fetch(
        `${META_GRAPH_URL}/act_${accountId}/insights?${params.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        console.error(`[Meta Ads] API error for account ${accountId}:`, error);
        continue;
      }

      const data = await response.json();
      const results = data.data || [];

      // 結果を整形（必要なフィールドのみ抽出）
      for (const row of results) {
        // 費用0除外
        if (reportConfig.excludeZeroCost && parseFloat(row.spend || '0') === 0) {
          continue;
        }

        // 必要なフィールドだけを抽出
        const flatRow: Record<string, unknown> = {
          date_start: row.date_start,
          campaign_name: row.campaign_name,
        };

        // ユーザーが選択したメトリクスのみ追加
        for (const metric of reportConfig.metrics) {
          if (row[metric] !== undefined) {
            flatRow[metric] = row[metric];
          }
        }

        allResults.push(flatRow);
      }
    } catch (error) {
      console.error(`[Meta Ads] Error fetching data for account ${accountId}:`, error);
    }
  }

  return allResults;
}

function generateDummyData(
  dimensions: string[],
  metrics: string[]
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const today = new Date();

  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const row: Record<string, unknown> = {};

    for (const dim of dimensions) {
      if (dim.includes('date')) {
        row[dim] = date.toISOString().split('T')[0];
      } else if (dim.includes('campaign')) {
        row[dim] = `キャンペーン ${Math.floor(Math.random() * 5) + 1}`;
      } else if (dim.includes('adset')) {
        row[dim] = `広告セット ${Math.floor(Math.random() * 3) + 1}`;
      } else if (dim.includes('ad')) {
        row[dim] = `広告 ${Math.floor(Math.random() * 10) + 1}`;
      } else {
        row[dim] = `値_${dim}`;
      }
    }

    for (const metric of metrics) {
      if (metric.includes('impressions')) {
        row[metric] = Math.floor(Math.random() * 10000) + 1000;
      } else if (metric.includes('clicks')) {
        row[metric] = Math.floor(Math.random() * 500) + 50;
      } else if (metric.includes('spend')) {
        row[metric] = (Math.random() * 500 + 50).toFixed(2);
      } else if (metric.includes('reach')) {
        row[metric] = Math.floor(Math.random() * 8000) + 800;
      } else if (metric.includes('frequency')) {
        row[metric] = (Math.random() * 2 + 1).toFixed(2);
      } else if (metric.includes('ctr')) {
        row[metric] = (Math.random() * 5 + 0.5).toFixed(2);
      } else if (metric.includes('cpc')) {
        row[metric] = (Math.random() * 100 + 10).toFixed(2);
      } else if (metric.includes('cpm')) {
        row[metric] = (Math.random() * 1000 + 100).toFixed(2);
      } else {
        row[metric] = Math.floor(Math.random() * 1000);
      }
    }

    rows.push(row);
  }

  return rows;
}

