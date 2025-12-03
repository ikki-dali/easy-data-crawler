import { google } from 'googleapis';
import { prisma } from '@/lib/db/prisma';
import { decryptCredentials, encryptCredentials } from '@/lib/encryption';
import { refreshGoogleAccessToken, createAuthenticatedClient } from '@/lib/google/client';

interface WriteToSpreadsheetParams {
  userId: string;
  spreadsheetId: string;
  sheetName: string;
  data: Record<string, unknown>[];
  dimensions: string[];
  metrics: string[];
}

async function getValidSheetsClient(userId: string) {
  const auth = await prisma.platformAuthentication.findFirst({
    where: {
      userId,
      platform: 'GOOGLE_SHEETS',
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!auth) {
    throw new Error('Google Sheets認証が必要です');
  }

  let credentials = decryptCredentials(auth.encryptedCredentials);

  // トークンの有効期限をチェック
  if (credentials.expiresAt && credentials.expiresAt < Date.now() + 60000) {
    if (!credentials.refreshToken) {
      throw new Error('リフレッシュトークンがありません。再認証が必要です。');
    }

    const newTokens = await refreshGoogleAccessToken(credentials.refreshToken);

    credentials = {
      accessToken: newTokens.access_token!,
      refreshToken: newTokens.refresh_token || credentials.refreshToken,
      expiresAt: newTokens.expiry_date || undefined,
    };

    // 更新されたトークンを保存
    await prisma.platformAuthentication.update({
      where: { id: auth.id },
      data: {
        encryptedCredentials: encryptCredentials(credentials),
      },
    });
  }

  const oauth2Client = createAuthenticatedClient(
    credentials.accessToken,
    credentials.refreshToken
  );

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

// ヘッダーを日本語に変換するマッピング
const headerTranslations: Record<string, string> = {
  // 日付関連
  'date': '日付',
  'date_start': '開始日',
  'date_stop': '終了日',
  
  // キャンペーン関連
  'campaign_name': 'キャンペーン名',
  'campaign_id': 'キャンペーンID',
  'adset_name': '広告セット名',
  'adset_id': '広告セットID',
  'ad_name': '広告名',
  'ad_id': '広告ID',
  
  // メトリクス
  'impressions': 'インプレッション',
  'clicks': 'クリック数',
  'spend': '消化金額',
  'reach': 'リーチ',
  'frequency': 'フリークエンシー',
  'ctr': 'CTR',
  'cpc': 'CPC',
  'cpm': 'CPM',
  'conversions': 'コンバージョン',
  'cost_per_conversion': 'コンバージョン単価',
  
  // アカウント関連
  'accountId': 'アカウントID',
  'account_id': 'アカウントID',
  'account_name': 'アカウント名',
  
  // その他
  'actions': 'アクション',
  'video_views': '動画再生数',
  'link_clicks': 'リンククリック',
};

function translateHeader(header: string): string {
  return headerTranslations[header] || header;
}

function formatCellValue(value: unknown): string | number {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

export async function writeToSpreadsheet(params: WriteToSpreadsheetParams): Promise<void> {
  const { userId, spreadsheetId, sheetName, data, dimensions, metrics } = params;

  if (data.length === 0) {
    console.log('[Sheets Writer] No data to write');
    return;
  }

  const sheets = await getValidSheetsClient(userId);

  // 必要なヘッダーのみを定義（基本フィールド + ユーザー選択のメトリクス）
  // 日付とキャンペーン名は必須として先頭に
  const baseFields = ['date_start', 'campaign_name'];
  
  // ユーザーが選択したメトリクスのみ（基本フィールドと重複しないもの）
  const userMetrics = metrics.filter(m => !baseFields.includes(m));
  
  // 最終的なヘッダー：日付、キャンペーン名、選択したメトリクスのみ
  const finalHeaders = [...baseFields, ...userMetrics];

  // ヘッダーを日本語に変換
  const translatedHeaders = finalHeaders.map(translateHeader);
  
  // データ行を作成
  const rows: (string | number)[][] = [
    translatedHeaders, // 日本語ヘッダー行
    ...data.map(row => 
      finalHeaders.map(header => formatCellValue(row[header]))
    ),
  ];

  // 既存データをクリア
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A:ZZ`,
    });
  } catch (error) {
    console.warn('[Sheets Writer] Could not clear existing data:', error);
  }

  // データを書き込み
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows,
    },
  });

  console.log(`[Sheets Writer] Wrote ${data.length} rows to ${sheetName}`);

  // ヘッダー行のスタイリング（オプション）
  try {
    // シートIDを取得
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheet = spreadsheet.data.sheets?.find(
      s => s.properties?.title === sheetName
    );

    if (sheet?.properties?.sheetId !== undefined) {
      // 特定のヘッダーに対する固定幅（十分に広く設定）
      const fixedWidths: Record<string, number> = {
        'date_start': 110,
        'campaign_name': 150,
        'impressions': 120,
        'clicks': 90,
        'spend': 100,
        'reach': 80,
        'frequency': 120,
        'ctr': 70,
        'cpc': 70,
        'cpm': 70,
      };
      
      console.log('[Sheets Writer] Setting column widths:', finalHeaders.map((h, i) => `${h}: ${fixedWidths[h] || 100}px`));

      // 列幅のリクエストを作成（各列に十分な幅を設定）
      const columnWidthRequests = finalHeaders.map((header, index) => {
        // 固定幅があればそれを使用、なければ計算
        const translatedHeader = translateHeader(header);
        const calculatedWidth = Math.max(100, translatedHeader.length * 18 + 30);
        const width = fixedWidths[header] || calculatedWidth;
        
        return {
          updateDimensionProperties: {
            range: {
              sheetId: sheet.properties!.sheetId,
              dimension: 'COLUMNS' as const,
              startIndex: index,
              endIndex: index + 1,
            },
            properties: {
              pixelSize: width,
            },
            fields: 'pixelSize',
          },
        };
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            // ヘッダー行のスタイル
            {
              repeatCell: {
                range: {
                  sheetId: sheet.properties.sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.7 },
                    textFormat: { 
                      bold: true,
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE',
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
              },
            },
            // 各列の幅を設定
            ...columnWidthRequests,
            // ヘッダー行の高さを固定
            {
              updateDimensionProperties: {
                range: {
                  sheetId: sheet.properties.sheetId,
                  dimension: 'ROWS',
                  startIndex: 0,
                  endIndex: 1,
                },
                properties: {
                  pixelSize: 32,
                },
                fields: 'pixelSize',
              },
            },
            // 列の固定（スクロール時にヘッダーが見える）
            {
              updateSheetProperties: {
                properties: {
                  sheetId: sheet.properties.sheetId,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
                fields: 'gridProperties.frozenRowCount',
              },
            },
          ],
        },
      });
    }
  } catch (error) {
    console.warn('[Sheets Writer] Could not apply formatting:', error);
  }
}

export async function appendToSpreadsheet(params: WriteToSpreadsheetParams): Promise<void> {
  const { userId, spreadsheetId, sheetName, data, dimensions, metrics } = params;

  if (data.length === 0) {
    console.log('[Sheets Writer] No data to append');
    return;
  }

  const sheets = await getValidSheetsClient(userId);

  const headers = [...dimensions, ...metrics];
  
  // データ行のみを作成（ヘッダーなし）
  const rows = data.map(row => 
    headers.map(header => formatCellValue(row[header]))
  );

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: rows,
    },
  });

  console.log(`[Sheets Writer] Appended ${data.length} rows to ${sheetName}`);
}

