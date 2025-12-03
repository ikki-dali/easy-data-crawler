// X (Twitter) Ads uses OAuth 1.0a
// Note: Full implementation requires oauth-1.0a library
// This is a simplified version for demonstration

const X_ADS_API_URL = 'https://ads-api.twitter.com/12';

function getXCredentials() {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  const redirectUri = process.env.X_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL}/api/platforms/x/callback`;

  if (!apiKey || !apiSecret) {
    throw new Error('X OAuth credentials are not configured');
  }

  return { apiKey, apiSecret, accessToken, accessTokenSecret, redirectUri };
}

export function getXAuthUrl(state?: string) {
  const { apiKey, redirectUri } = getXCredentials();

  // OAuth 1.0a flow requires request token first
  // For simplicity, using OAuth 2.0 style URL (requires Twitter API v2)
  const params = new URLSearchParams({
    client_id: apiKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'ads.read ads.write tweet.read users.read offline.access',
    state: state || '',
    code_challenge: 'challenge',
    code_challenge_method: 'plain',
  });

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

export async function getXTokensFromCode(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
}> {
  const { apiKey, apiSecret, redirectUri } = getXCredentials();

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: 'challenge',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to get X access token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

export interface XAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export async function getXAdAccounts(accessToken: string): Promise<XAdAccount[]> {
  const response = await fetch(`${X_ADS_API_URL}/accounts`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get X ad accounts');
  }

  const data = await response.json();

  return (data.data || []).map((account: {
    id: string;
    name: string;
    currency: string;
    timezone: string;
  }) => ({
    id: account.id,
    name: account.name,
    currency: account.currency,
    timezone: account.timezone,
  }));
}

export async function getXUserInfo(accessToken: string): Promise<{
  id: string;
  username: string;
  name: string;
}> {
  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  const data = await response.json();

  return {
    id: data.data.id,
    username: data.data.username,
    name: data.data.name,
  };
}

