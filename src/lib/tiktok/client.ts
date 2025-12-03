const TIKTOK_AUTH_URL = 'https://business-api.tiktok.com/portal/auth';
const TIKTOK_TOKEN_URL = 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/';
const TIKTOK_API_URL = 'https://business-api.tiktok.com/open_api/v1.3';

function getTikTokCredentials() {
  const appId = process.env.TIKTOK_APP_ID;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL}/api/platforms/tiktok/callback`;

  if (!appId || !appSecret) {
    throw new Error('TikTok OAuth credentials are not configured');
  }

  return { appId, appSecret, redirectUri };
}

export function getTikTokAuthUrl(state?: string) {
  const { appId, redirectUri } = getTikTokCredentials();

  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: redirectUri,
    state: state || '',
  });

  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

export async function getTikTokTokensFromCode(authCode: string): Promise<{
  accessToken: string;
  advertiserId: string;
}> {
  const { appId, appSecret } = getTikTokCredentials();

  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: appId,
      secret: appSecret,
      auth_code: authCode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get TikTok access token');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(data.message || 'TikTok OAuth error');
  }

  return {
    accessToken: data.data.access_token,
    advertiserId: data.data.advertiser_id,
  };
}

export interface TikTokAdAccount {
  advertiserId: string;
  advertiserName: string;
  currency: string;
  timezone: string;
}

export async function getTikTokAdAccounts(accessToken: string): Promise<TikTokAdAccount[]> {
  const { appId } = getTikTokCredentials();

  const response = await fetch(`${TIKTOK_API_URL}/oauth2/advertiser/get/`, {
    method: 'GET',
    headers: {
      'Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get TikTok ad accounts');
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(data.message || 'Failed to get ad accounts');
  }

  return (data.data.list || []).map((account: {
    advertiser_id: string;
    advertiser_name: string;
    currency: string;
    timezone: string;
  }) => ({
    advertiserId: account.advertiser_id,
    advertiserName: account.advertiser_name,
    currency: account.currency,
    timezone: account.timezone,
  }));
}

