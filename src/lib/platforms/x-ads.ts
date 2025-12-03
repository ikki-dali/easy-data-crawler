import { ReportConfig } from '@/types/report';

const X_ADS_API_URL = 'https://ads-api.twitter.com/12';

interface XReportRow {
  [key: string]: string | number;
}

export async function fetchXAdsData(
  accessToken: string,
  _accountIds: string[],
  reportConfig: ReportConfig
): Promise<XReportRow[]> {
  // X Ads API を使用したデータ取得
  // 実際の実装では proper API calls が必要
  
  console.log('Fetching X Ads data');
  console.log('Report config:', reportConfig);
  
  // ダミーデータを返す（開発用）
  const dummyData: XReportRow[] = [
    {
      date: '2024-01-15',
      campaign_name: 'X キャンペーン A',
      impressions: 40000,
      engagements: 3200,
      clicks: 1600,
      spend: 60000,
      conversions: 30,
      engagement_rate: 8.0,
      cpc: 37.5,
      cpm: 1500,
    },
    {
      date: '2024-01-15',
      campaign_name: 'X キャンペーン B',
      impressions: 25000,
      engagements: 1750,
      clicks: 875,
      spend: 40000,
      conversions: 20,
      engagement_rate: 7.0,
      cpc: 45.71,
      cpm: 1600,
    },
  ];

  return dummyData;
}

export async function fetchXReportData(
  accessToken: string,
  accountId: string,
  startTime: string,
  endTime: string,
  granularity: 'DAY' | 'HOUR' | 'TOTAL' = 'DAY'
): Promise<XReportRow[]> {
  const params = new URLSearchParams({
    start_time: startTime,
    end_time: endTime,
    granularity,
    placement: 'ALL_ON_TWITTER',
  });

  const response = await fetch(
    `${X_ADS_API_URL}/stats/accounts/${accountId}?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch X report');
  }

  const data = await response.json();

  return data.data || [];
}

