# 3-6: Step 1 - スプレッドシートURL入力

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 3-6 |
| **複雑度** | Medium |
| **見積もり** | 2時間 |
| **依存** | 3-5 |
| **ステータス** | ⬜ 未着手 |

## 説明

スプレッドシートのURLを入力し、バリデーション（形式チェック、アクセス権限確認）を行う。

## タスク

- [ ] URL入力フォーム
- [ ] URL形式バリデーション
- [ ] スプレッドシートIDの抽出
- [ ] アクセス権限確認API

## 実装詳細

### バリデーションスキーマ

```typescript
// src/lib/validations/crawler.ts に追加
export const spreadsheetUrlSchema = z.object({
  spreadsheetUrl: z
    .string()
    .min(1, 'スプレッドシートURLを入力してください')
    .regex(
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      '有効なGoogleスプレッドシートURLを入力してください'
    ),
});

export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}
```

### スプレッドシート検証API

```typescript
// src/app/api/spreadsheet/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { spreadsheetId } = await request.json();

  try {
    // Google Sheets API でアクセス確認
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties',
    });

    return NextResponse.json({
      valid: true,
      title: response.data.properties?.title,
      sheets: response.data.sheets?.map((s) => ({
        sheetId: s.properties?.sheetId,
        title: s.properties?.title,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'スプレッドシートにアクセスできません' },
      { status: 400 }
    );
  }
}
```

### Step 1 コンポーネント

```typescript
// src/components/crawler/steps/step-spreadsheet.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2 } from 'lucide-react';

interface StepSpreadsheetProps {
  spreadsheetUrl: string;
  onUrlChange: (url: string) => void;
  onValidated: (spreadsheetId: string, sheets: Sheet[]) => void;
  error?: string;
}

export function StepSpreadsheet({
  spreadsheetUrl,
  onUrlChange,
  onValidated,
  error,
}: StepSpreadsheetProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleValidate = async () => {
    setIsValidating(true);
    // 検証ロジック
    setIsValidating(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>スプレッドシートURL *</Label>
        <div className="flex gap-2">
          <Input
            value={spreadsheetUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
          />
          <Button onClick={handleValidate} disabled={isValidating}>
            {isValidating ? <Loader2 className="animate-spin" /> : '検証'}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {validationResult?.valid && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            「{validationResult.title}」にアクセスできます
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

## 完了条件

- [ ] URLを入力できる
- [ ] URL形式が検証される
- [ ] スプレッドシートへのアクセスが確認される
- [ ] アクセスできない場合にエラーが表示される

## 参考リソース

- [Google Sheets API](https://developers.google.com/sheets/api)

