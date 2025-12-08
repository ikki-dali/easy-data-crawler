const META_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const META_GRAPH_URL = 'https://graph.facebook.com/v18.0';

const SCOPES = ['ads_management', 'ads_read', 'business_management'];

function getMetaCredentials() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  
  // リダイレクトURIの決定: 環境変数 > NEXTAUTH_URL > デフォルト
  let redirectUri = process.env.META_REDIRECT_URI;
  
  if (!redirectUri) {
    // 開発環境ではlocalhostを使用
    if (process.env.NODE_ENV === 'development' || process.env.NEXTAUTH_URL?.includes('localhost')) {
      redirectUri = 'http://localhost:3000/api/platforms/meta/callback';
    } else {
      redirectUri = `${process.env.NEXTAUTH_URL}/api/platforms/meta/callback`;
    }
  }

  if (!appId || !appSecret) {
    throw new Error('Meta OAuth credentials are not configured');
  }

  return { appId, appSecret, redirectUri };
}

export function getMetaAuthUrl(state?: string) {
  const { appId, redirectUri } = getMetaCredentials();

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(','),
    response_type: 'code',
    ...(state && { state }),
  });

  return `${META_AUTH_URL}?${params.toString()}`;
}

export async function getMetaTokensFromCode(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const { appId, appSecret, redirectUri } = getMetaCredentials();

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get Meta access token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const { appId, appSecret } = getMetaCredentials();

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to exchange for long-lived token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export async function getMetaUserInfo(accessToken: string): Promise<{
  id: string;
  name: string;
  email?: string;
}> {
  const params = new URLSearchParams({
    fields: 'id,name,email',
    access_token: accessToken,
  });

  const response = await fetch(`${META_GRAPH_URL}/me?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get user info');
  }

  return await response.json();
}

export interface MetaAdAccount {
  id: string;
  accountId: string;
  name: string;
  currency: string;
  accountStatus: number;
}

export async function getMetaAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const params = new URLSearchParams({
    fields: 'account_id,name,currency,account_status',
    access_token: accessToken,
    limit: '100',
  });

  const response = await fetch(`${META_GRAPH_URL}/me/adaccounts?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get ad accounts');
  }

  const data = await response.json();

  return (data.data || []).map((account: {
    id: string;
    account_id: string;
    name: string;
    currency: string;
    account_status: number;
  }) => ({
    id: account.id,
    accountId: account.account_id,
    name: account.name,
    currency: account.currency,
    accountStatus: account.account_status,
  }));
}

export { SCOPES as META_SCOPES };

