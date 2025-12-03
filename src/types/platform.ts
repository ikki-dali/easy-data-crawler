export const PLATFORMS = {
  GOOGLE_ADS: 'GOOGLE_ADS',
  GOOGLE_ANALYTICS: 'GOOGLE_ANALYTICS',
  META_ADS: 'META_ADS',
  TIKTOK_ADS: 'TIKTOK_ADS',
  LINE_ADS: 'LINE_ADS',
  LINE_ADS_SYNC: 'LINE_ADS_SYNC',
  YAHOO_SEARCH: 'YAHOO_SEARCH',
  YAHOO_DISPLAY: 'YAHOO_DISPLAY',
  SMARTNEWS_ADS: 'SMARTNEWS_ADS',
  SMARTNEWS_ADS_V2: 'SMARTNEWS_ADS_V2',
  MICROSOFT_ADS: 'MICROSOFT_ADS',
  X_ADS: 'X_ADS',
  FACEBOOK_PAGE_INSIGHTS: 'FACEBOOK_PAGE_INSIGHTS',
  INSTAGRAM_INSIGHTS: 'INSTAGRAM_INSIGHTS',
  AMAZON_SELLER: 'AMAZON_SELLER',
  AD_EBIS: 'AD_EBIS',
  GOOGLE_SHEETS: 'GOOGLE_SHEETS',
} as const;

export type Platform = typeof PLATFORMS[keyof typeof PLATFORMS];

export interface PlatformInfo {
  id: Platform;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  beta?: boolean;
  requiresContact?: boolean;
}

export const PLATFORM_LIST: PlatformInfo[] = [
  {
    id: 'GOOGLE_ADS',
    name: 'Google広告',
    description: 'Google Ads のキャンペーン・広告データ',
    icon: 'google',
    available: true,
  },
  {
    id: 'GOOGLE_ANALYTICS',
    name: 'Googleアナリティクス',
    description: 'GA4 のアナリティクスデータ',
    icon: 'analytics',
    available: true,
  },
  {
    id: 'META_ADS',
    name: 'Meta広告',
    description: 'Facebook/Instagram 広告データ',
    icon: 'meta',
    available: true,
  },
  {
    id: 'TIKTOK_ADS',
    name: 'TikTok広告',
    description: 'TikTok Ads のキャンペーンデータ',
    icon: 'tiktok',
    available: true,
  },
  {
    id: 'LINE_ADS',
    name: 'LINE広告',
    description: 'LINE広告のキャンペーンデータ',
    icon: 'line',
    available: true,
  },
  {
    id: 'LINE_ADS_SYNC',
    name: 'LINE広告（同期）',
    description: 'LINE広告の同期データ',
    icon: 'line',
    available: true,
  },
  {
    id: 'YAHOO_SEARCH',
    name: 'Yahoo広告（検索）',
    description: 'Yahoo! 検索広告データ',
    icon: 'yahoo',
    available: true,
  },
  {
    id: 'YAHOO_DISPLAY',
    name: 'Yahoo広告（ディスプレイ）',
    description: 'Yahoo! ディスプレイ広告データ',
    icon: 'yahoo',
    available: true,
  },
  {
    id: 'SMARTNEWS_ADS',
    name: 'SmartNews広告',
    description: 'SmartNews Ads のキャンペーンデータ',
    icon: 'smartnews',
    available: true,
  },
  {
    id: 'SMARTNEWS_ADS_V2',
    name: 'SmartNews広告 V2',
    description: 'SmartNews Ads V2 のキャンペーンデータ',
    icon: 'smartnews',
    available: true,
  },
  {
    id: 'MICROSOFT_ADS',
    name: 'Microsoft広告',
    description: 'Microsoft Advertising のキャンペーンデータ',
    icon: 'microsoft',
    available: true,
  },
  {
    id: 'X_ADS',
    name: 'X広告',
    description: 'X (Twitter) 広告のキャンペーンデータ',
    icon: 'x',
    available: true,
  },
  {
    id: 'FACEBOOK_PAGE_INSIGHTS',
    name: 'Facebookページインサイト',
    description: 'Facebookページのインサイトデータ',
    icon: 'facebook',
    available: true,
    beta: true,
    requiresContact: true,
  },
  {
    id: 'INSTAGRAM_INSIGHTS',
    name: 'Instagramインサイト',
    description: 'Instagramのインサイトデータ',
    icon: 'instagram',
    available: true,
    beta: true,
    requiresContact: true,
  },
  {
    id: 'AMAZON_SELLER',
    name: 'Amazon Seller Central',
    description: 'Amazon Seller Central のデータ',
    icon: 'amazon',
    available: false,
  },
  {
    id: 'AD_EBIS',
    name: 'アドエビス',
    description: 'アドエビスのコンバージョンデータ',
    icon: 'adebis',
    available: true,
    beta: true,
    requiresContact: true,
  },
];

