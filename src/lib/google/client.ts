import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function getGoogleOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${process.env.NEXTAUTH_URL}/api/platforms/google-sheets/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials are not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl(state?: string) {
  const oauth2Client = getGoogleOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state,
  });
}

export async function getGoogleTokensFromCode(code: string) {
  const oauth2Client = getGoogleOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export function createAuthenticatedClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return oauth2Client;
}

export async function getGoogleUserInfo(accessToken: string) {
  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  
  return {
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

export { SCOPES };

