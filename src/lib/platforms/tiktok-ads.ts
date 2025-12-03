import { ReportConfig } from '@/types/report';

const TIKTOK_API_URL = 'https://business-api.tiktok.com/open_api/v1.3';

interface TikTokReportRow {
  [key: string]: string | number;
}

export async function fetchTikTokAdsData(
  accessToken: string,
  advertiserId: string,
  _accountIds: string[],
  reportConfig: ReportConfig
): Promise<TikTokReportRow[]> {
  // TikTok Reporting API を使用したデータ取得
  // 実際の実装では proper API calls が必要
  
  console.log(`Fetching TikTok Ads data for advertiser ${advertiserId}`);
  console.log('Report config:', reportConfig);
  
  // ダミーデータを返す（開発用）
  const dummyData: TikTokReportRow[] = [
    {
      date: '2024-01-15',
      campaign_name: 'TikTok キャンペーン A',
      impressions: 50000,
      clicks: 2500,
      spend: 75000,
      conversions: 50,
      ctr: 5.0,
      cpc: 30,
      cpm: 1500,
    },
    {
      date: '2024-01-15',
      campaign_name: 'TikTok キャンペーン B',
      impressions: 30000,
      clicks: 1200,
      spend: 45000,
      conversions: 25,
      ctr: 4.0,
      cpc: 37.5,
      cpm: 1500,
    },
  ];

  return dummyData;
}

export async function fetchTikTokReportData(
  accessToken: string,
  advertiserId: string,
  dimensions: string[],
  metrics: string[],
  startDate: string,
  endDate: string
): Promise<TikTokReportRow[]> {
  const response = await fetch(`${TIKTOK_API_URL}/report/integrated/get/`, {
    method: 'POST',
    headers: {
      'Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      advertiser_id: advertiserId,
      report_type: 'BASIC',
      dimensions: dimensions,
      metrics: metrics,
      data_level: 'AUCTION_CAMPAIGN',
      start_date: startDate,
      end_date: endDate,
      page: 1,
      page_size: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch TikTok report');
  }

  const data = await response.json();
  
  if (data.code !== 0) {
    throw new Error(data.message || 'TikTok API error');
  }

  return data.data.list || [];
}

