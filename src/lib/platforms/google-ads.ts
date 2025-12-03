import { prisma } from '@/lib/db/prisma';
import { decryptCredentials, encryptCredentials } from '@/lib/encryption';
import { refreshGoogleAdsAccessToken, getDeveloperToken } from '@/lib/google/ads-client';
import { CrawlerJobData } from '@/lib/queue/crawler-queue';

const GOOGLE_ADS_API_URL = 'https://googleads.googleapis.com/v15';

interface GoogleAdsCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

async function getValidCredentials(userId: string): Promise<GoogleAdsCredentials> {
  const auth = await prisma.platformAuthentication.findFirst({
    where: {
      userId,
      platform: 'GOOGLE_ADS',
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!auth) {
    throw new Error('Google Ads認証が必要です');
  }

  const credentials = decryptCredentials(auth.encryptedCredentials);

  // トークンの有効期限をチェック
  if (credentials.expiresAt && credentials.expiresAt < Date.now() + 60000) {
    if (!credentials.refreshToken) {
      throw new Error('リフレッシュトークンがありません。再認証が必要です。');
    }

    const newTokens = await refreshGoogleAdsAccessToken(credentials.refreshToken);

    const newCredentials = {
      accessToken: newTokens.access_token!,
      refreshToken: newTokens.refresh_token || credentials.refreshToken,
      expiresAt: newTokens.expiry_date || undefined,
    };

    // 更新されたトークンを保存
    await prisma.platformAuthentication.update({
      where: { id: auth.id },
      data: {
        encryptedCredentials: encryptCredentials(newCredentials),
      },
    });

    return newCredentials;
  }

  return credentials;
}

function buildGAQLQuery(
  dimensions: string[],
  metrics: string[],
  dateRange: { startDate: string; endDate: string }
): string {
  // ディメンションとメトリクスをGAQL形式に変換
  const selectFields = [...dimensions, ...metrics].join(', ');

  // 日付フィルタ
  const whereClause = `segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'`;

  // 基本的なクエリ
  return `
    SELECT ${selectFields}
    FROM campaign
    WHERE ${whereClause}
    ORDER BY segments.date DESC
  `;
}

function calculateDateRange(reportConfig: CrawlerJobData['reportConfig']): {
  startDate: string;
  endDate: string;
} {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  switch (reportConfig.dateRangeType) {
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
    }
    case 'last_x_days_include': {
      const days = reportConfig.lookbackDays || 7;
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - days + 1);
      return { startDate: formatDate(startDate), endDate: formatDate(today) };
    }
    case 'last_x_days_exclude': {
      const days = reportConfig.lookbackDays || 7;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const startDate = new Date(yesterday);
      startDate.setDate(startDate.getDate() - days + 1);
      return { startDate: formatDate(startDate), endDate: formatDate(yesterday) };
    }
    case 'this_month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDate(startOfMonth), endDate: formatDate(today) };
    }
    case 'last_month': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: formatDate(startOfLastMonth), endDate: formatDate(endOfLastMonth) };
    }
    default: {
      // デフォルトは過去7日
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      return { startDate: formatDate(startDate), endDate: formatDate(today) };
    }
  }
}

export async function fetchGoogleAdsData(
  jobData: CrawlerJobData
): Promise<Record<string, unknown>[]> {
  const { userId, accountIds, reportConfig, isTest } = jobData;

  // テスト実行時はダミーデータを返す
  if (isTest) {
    console.log('[Google Ads] Test mode - returning dummy data');
    return generateDummyData(reportConfig.dimensions, reportConfig.metrics);
  }

  const credentials = await getValidCredentials(userId);
  let developerToken: string;

  try {
    developerToken = getDeveloperToken();
  } catch {
    console.warn('[Google Ads] Developer token not configured, using demo mode');
    return generateDummyData(reportConfig.dimensions, reportConfig.metrics);
  }

  const dateRange = calculateDateRange(reportConfig);
  const query = buildGAQLQuery(reportConfig.dimensions, reportConfig.metrics, dateRange);

  const allResults: Record<string, unknown>[] = [];

  // 各アカウントからデータを取得
  for (const accountId of accountIds) {
    try {
      const response = await fetch(
        `${GOOGLE_ADS_API_URL}/customers/${accountId}/googleAds:searchStream`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error(`[Google Ads] API error for account ${accountId}:`, error);
        continue;
      }

      const data = await response.json();
      const results = data.results || [];

      // 結果を整形
      for (const row of results) {
        const flatRow: Record<string, unknown> = {
          accountId,
        };

        // フィールドを展開
        for (const [key, value] of Object.entries(row)) {
          if (typeof value === 'object' && value !== null) {
            for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
              flatRow[`${key}.${subKey}`] = subValue;
            }
          } else {
            flatRow[key] = value;
          }
        }

        // 費用0除外
        if (reportConfig.excludeZeroCost) {
          const costField = Object.keys(flatRow).find(k => k.includes('cost'));
          if (costField && flatRow[costField] === 0) {
            continue;
          }
        }

        allResults.push(flatRow);
      }
    } catch (error) {
      console.error(`[Google Ads] Error fetching data for account ${accountId}:`, error);
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
      } else if (dim.includes('ad_group')) {
        row[dim] = `広告グループ ${Math.floor(Math.random() * 3) + 1}`;
      } else {
        row[dim] = `値_${dim}`;
      }
    }

    for (const metric of metrics) {
      if (metric.includes('impressions')) {
        row[metric] = Math.floor(Math.random() * 10000) + 1000;
      } else if (metric.includes('clicks')) {
        row[metric] = Math.floor(Math.random() * 500) + 50;
      } else if (metric.includes('cost') || metric.includes('spend')) {
        row[metric] = Math.floor(Math.random() * 50000) + 5000;
      } else if (metric.includes('conversions')) {
        row[metric] = Math.floor(Math.random() * 50) + 5;
      } else if (metric.includes('ctr')) {
        row[metric] = (Math.random() * 5 + 0.5).toFixed(2);
      } else if (metric.includes('cpc')) {
        row[metric] = Math.floor(Math.random() * 100) + 10;
      } else {
        row[metric] = Math.floor(Math.random() * 1000);
      }
    }

    rows.push(row);
  }

  return rows;
}

