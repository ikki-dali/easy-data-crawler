const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_ADS_API_URL = 'https://ads.line.me/api/v3';

function getLineCredentials() {
  const clientId = process.env.LINE_CLIENT_ID;
  const clientSecret = process.env.LINE_CLIENT_SECRET;
  const redirectUri = process.env.LINE_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL}/api/platforms/line/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('LINE OAuth credentials are not configured');
  }

  return { clientId, clientSecret, redirectUri };
}

export function getLineAuthUrl(state?: string) {
  const { clientId, redirectUri } = getLineCredentials();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state || '',
    scope: 'profile openid',
    // LINE Ads specific scopes may be required
  });

  return `${LINE_AUTH_URL}?${params.toString()}`;
}

export async function getLineTokensFromCode(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret, redirectUri } = getLineCredentials();

  const response = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to get LINE access token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresIn: data.expires_in,
  };
}

export async function getLineProfile(accessToken: string): Promise<{
  userId: string;
  displayName: string;
  pictureUrl?: string;
}> {
  const response = await fetch('https://api.line.me/v2/profile', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get LINE profile');
  }

  const data = await response.json();

  return {
    userId: data.userId,
    displayName: data.displayName,
    pictureUrl: data.pictureUrl,
  };
}

export interface LineAdAccount {
  accountId: string;
  accountName: string;
  currency: string;
  status: string;
}

export async function getLineAdAccounts(accessToken: string): Promise<LineAdAccount[]> {
  // LINE Ads API requires separate authentication
  // This is a simplified version
  const response = await fetch(`${LINE_ADS_API_URL}/accounts`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // API may not be available in all regions
    throw new Error('Failed to get LINE ad accounts');
  }

  const data = await response.json();

  return (data.accounts || []).map((account: {
    accountId: string;
    accountName: string;
    currency: string;
    status: string;
  }) => ({
    accountId: account.accountId,
    accountName: account.accountName,
    currency: account.currency,
    status: account.status,
  }));
}

