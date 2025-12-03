import { google, sheets_v4, drive_v3 } from 'googleapis';
import { createAuthenticatedClient, refreshGoogleAccessToken } from './client';
import { prisma } from '@/lib/db/prisma';
import { decryptCredentials, encryptCredentials } from '@/lib/encryption';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  sheets: SheetInfo[];
}

export interface SheetInfo {
  sheetId: number;
  title: string;
  index: number;
}

export async function getGoogleSheetsClient(userId: string): Promise<sheets_v4.Sheets | null> {
  const auth = await prisma.platformAuthentication.findFirst({
    where: {
      userId,
      platform: 'GOOGLE_SHEETS',
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (!auth) {
    return null;
  }

  const credentials = decryptCredentials(auth.encryptedCredentials);
  
  // トークンの有効期限をチェックし、必要なら更新
  if (credentials.expiresAt && credentials.expiresAt < Date.now() + 60000) {
    if (!credentials.refreshToken) {
      throw new Error('リフレッシュトークンがありません。再認証が必要です。');
    }

    const newCredentials = await refreshGoogleAccessToken(credentials.refreshToken);
    
    // 新しいトークンを保存
    const encryptedCredentials = encryptCredentials({
      accessToken: newCredentials.access_token!,
      refreshToken: newCredentials.refresh_token || credentials.refreshToken,
      expiresAt: newCredentials.expiry_date || undefined,
      tokenType: newCredentials.token_type || undefined,
    });

    await prisma.platformAuthentication.update({
      where: { id: auth.id },
      data: { encryptedCredentials },
    });

    credentials.accessToken = newCredentials.access_token!;
  }

  const oauth2Client = createAuthenticatedClient(
    credentials.accessToken,
    credentials.refreshToken
  );

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export async function getGoogleDriveClient(userId: string): Promise<drive_v3.Drive | null> {
  const auth = await prisma.platformAuthentication.findFirst({
    where: {
      userId,
      platform: 'GOOGLE_SHEETS',
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (!auth) {
    return null;
  }

  const credentials = decryptCredentials(auth.encryptedCredentials);
  const oauth2Client = createAuthenticatedClient(
    credentials.accessToken,
    credentials.refreshToken
  );

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export function extractSpreadsheetId(url: string): string | null {
  // サポートするURLパターン:
  // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
  // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
  // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function getSpreadsheetInfo(
  userId: string,
  spreadsheetUrl: string
): Promise<SpreadsheetInfo | null> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
  if (!spreadsheetId) {
    throw new Error('無効なスプレッドシートURLです');
  }

  const sheets = await getGoogleSheetsClient(userId);
  if (!sheets) {
    throw new Error('Google認証が必要です');
  }

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: false,
  });

  const spreadsheet = response.data;

  return {
    id: spreadsheetId,
    name: spreadsheet.properties?.title || '',
    url: spreadsheetUrl,
    sheets: (spreadsheet.sheets || []).map(sheet => ({
      sheetId: sheet.properties?.sheetId || 0,
      title: sheet.properties?.title || '',
      index: sheet.properties?.index || 0,
    })),
  };
}

export async function listRecentSpreadsheets(
  userId: string,
  maxResults = 10
): Promise<Array<{ id: string; name: string; url: string }>> {
  const drive = await getGoogleDriveClient(userId);
  if (!drive) {
    throw new Error('Google認証が必要です');
  }

  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet'",
    orderBy: 'modifiedTime desc',
    pageSize: maxResults,
    fields: 'files(id, name, webViewLink)',
  });

  return (response.data.files || []).map(file => ({
    id: file.id || '',
    name: file.name || '',
    url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
  }));
}

export async function validateSpreadsheetAccess(
  userId: string,
  spreadsheetUrl: string
): Promise<{ valid: boolean; error?: string; info?: SpreadsheetInfo }> {
  try {
    const info = await getSpreadsheetInfo(userId, spreadsheetUrl);
    return { valid: true, info: info || undefined };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { valid: false, error: 'スプレッドシートが見つかりません' };
      }
      if (error.message.includes('permission')) {
        return { valid: false, error: 'スプレッドシートへのアクセス権がありません' };
      }
      return { valid: false, error: error.message };
    }
    return { valid: false, error: '不明なエラーが発生しました' };
  }
}

