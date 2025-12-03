import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/adwords'];

export function getGoogleAdsOAuth2Client() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL}/api/platforms/google-ads/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google Ads OAuth credentials are not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAdsAuthUrl(state?: string) {
  const oauth2Client = getGoogleAdsOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state,
  });
}

export async function getGoogleAdsTokensFromCode(code: string) {
  const oauth2Client = getGoogleAdsOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshGoogleAdsAccessToken(refreshToken: string) {
  const oauth2Client = getGoogleAdsOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export function getDeveloperToken(): string {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!token) {
    throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured');
  }
  return token;
}

export { SCOPES as GOOGLE_ADS_SCOPES };

