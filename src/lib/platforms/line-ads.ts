import { ReportConfig } from '@/types/report';

const LINE_ADS_API_URL = 'https://ads.line.me/api/v3';

interface LineReportRow {
  [key: string]: string | number;
}

export async function fetchLineAdsData(
  accessToken: string,
  _accountIds: string[],
  reportConfig: ReportConfig
): Promise<LineReportRow[]> {
  // LINE Ads API を使用したデータ取得
  // 実際の実装では proper API calls が必要
  
  console.log('Fetching LINE Ads data');
  console.log('Report config:', reportConfig);
  
  // ダミーデータを返す（開発用）
  const dummyData: LineReportRow[] = [
    {
      date: '2024-01-15',
      campaign_name: 'LINE キャンペーン A',
      impressions: 80000,
      reach: 60000,
      clicks: 4000,
      spend: 120000,
      conversions: 80,
      ctr: 5.0,
      cpc: 30,
      cpm: 1500,
      frequency: 1.33,
    },
    {
      date: '2024-01-15',
      campaign_name: 'LINE キャンペーン B',
      impressions: 45000,
      reach: 35000,
      clicks: 1800,
      spend: 67500,
      conversions: 45,
      ctr: 4.0,
      cpc: 37.5,
      cpm: 1500,
      frequency: 1.29,
    },
  ];

  return dummyData;
}

export async function fetchLineReportData(
  accessToken: string,
  accountId: string,
  startDate: string,
  endDate: string
): Promise<LineReportRow[]> {
  const response = await fetch(
    `${LINE_ADS_API_URL}/reports/adAccounts/${accountId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        metrics: [
          'impressions',
          'reach',
          'clicks',
          'cost',
          'conversions',
          'ctr',
          'cpc',
          'cpm',
        ],
        dimensions: ['date', 'campaign'],
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch LINE report');
  }

  const data = await response.json();

  return data.rows || [];
}

