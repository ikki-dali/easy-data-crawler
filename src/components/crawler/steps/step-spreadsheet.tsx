'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { Sheet } from '@/types/crawler-form';

interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  sheets: Sheet[];
}

interface GoogleStatus {
  authenticated: boolean;
  email?: string | null;
}

interface StepSpreadsheetProps {
  spreadsheetUrl: string;
  spreadsheetId: string;
  sheetName: string;
  availableSheets: Sheet[];
  onChange: (data: {
    spreadsheetUrl: string;
    spreadsheetId: string;
    sheetName: string;
    availableSheets: Sheet[];
  }) => void;
  errors?: Record<string, string>;
}

export function StepSpreadsheet({
  spreadsheetUrl,
  spreadsheetId,
  sheetName,
  availableSheets,
  onChange,
  errors,
}: StepSpreadsheetProps) {
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    spreadsheet?: SpreadsheetInfo;
  } | null>(null);
  const [urlInput, setUrlInput] = useState(spreadsheetUrl);

  // Google認証状態を確認
  useEffect(() => {
    checkGoogleStatus();
  }, []);

  const checkGoogleStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/platforms/google-sheets/status');
      const data = await res.json();
      setGoogleStatus(data);
    } catch {
      setGoogleStatus({ authenticated: false });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Google OAuth 連携を開始
  const handleConnectGoogle = () => {
    const returnTo = encodeURIComponent('/crawlers/new?step=1');
    window.location.href = `/api/platforms/google-sheets/authorize?returnTo=${returnTo}`;
  };

  // スプレッドシートURLを検証
  const validateSpreadsheet = async () => {
    if (!urlInput) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/platforms/google-sheets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });

      const data = await res.json();

      if (data.valid && data.spreadsheet) {
        setValidationResult({ valid: true, spreadsheet: data.spreadsheet });
        onChange({
          spreadsheetUrl: urlInput,
          spreadsheetId: data.spreadsheet.id,
          sheetName: data.spreadsheet.sheets[0]?.title || '',
          availableSheets: data.spreadsheet.sheets.map((s: { sheetId: number; title: string }) => ({
            sheetId: s.sheetId,
            title: s.title,
          })),
        });
      } else {
        setValidationResult({ valid: false, error: data.error });
      }
    } catch {
      setValidationResult({ valid: false, error: '検証に失敗しました' });
    } finally {
      setIsValidating(false);
    }
  };

  // シート選択を変更
  const handleSheetChange = (selectedSheet: string) => {
    onChange({
      spreadsheetUrl,
      spreadsheetId,
      sheetName: selectedSheet,
      availableSheets,
    });
  };

  // ローディング中
  if (isLoadingStatus) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Google未連携の場合
  if (!googleStatus?.authenticated) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Google Sheetsと連携するにはGoogleアカウントでの認証が必要です。
          </AlertDescription>
        </Alert>

        <div className="flex flex-col items-center gap-4 py-8">
          <FileSpreadsheet className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-medium">Googleアカウントを連携</h3>
            <p className="text-sm text-muted-foreground mt-1">
              スプレッドシートへのアクセス許可をお願いします
            </p>
          </div>
          <Button onClick={handleConnectGoogle} size="lg">
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleで認証する
          </Button>
        </div>
      </div>
    );
  }

  // Google連携済みの場合
  return (
    <div className="space-y-6">
      {/* 連携状態 */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm">
            <span className="font-medium">{googleStatus.email}</span> で連携中
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={checkGoogleStatus}>
          <RefreshCw className="h-4 w-4 mr-1" />
          更新
        </Button>
      </div>

      {/* スプレッドシートURL入力 */}
      <div className="space-y-2">
        <Label htmlFor="spreadsheetUrl">スプレッドシートURL</Label>
        <div className="flex gap-2">
          <Input
            id="spreadsheetUrl"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className={errors?.spreadsheetUrl ? 'border-red-500' : ''}
          />
          <Button
            onClick={validateSpreadsheet}
            disabled={!urlInput || isValidating}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '検証'
            )}
          </Button>
        </div>
        {errors?.spreadsheetUrl && (
          <p className="text-sm text-red-500">{errors.spreadsheetUrl}</p>
        )}
        <p className="text-xs text-muted-foreground">
          出力先のGoogleスプレッドシートURLを入力してください
        </p>
      </div>

      {/* 検証結果 */}
      {validationResult && (
        <div className="space-y-4">
          {validationResult.valid && validationResult.spreadsheet ? (
            <>
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <span className="font-medium">
                    {validationResult.spreadsheet.name}
                  </span>{' '}
                  にアクセスできます
                  <a
                    href={validationResult.spreadsheet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary inline-flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    開く
                  </a>
                </AlertDescription>
              </Alert>

              {/* シート選択 */}
              <div className="space-y-2">
                <Label htmlFor="sheetName">出力先シート</Label>
                <Select value={sheetName} onValueChange={handleSheetChange}>
                  <SelectTrigger
                    className={errors?.sheetName ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="シートを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSheets.map((sheet) => (
                      <SelectItem key={sheet.sheetId} value={sheet.title}>
                        {sheet.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors?.sheetName && (
                  <p className="text-sm text-red-500">{errors.sheetName}</p>
                )}
              </div>

              {/* 選択済みの情報 */}
              {sheetName && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span className="font-medium">出力先設定</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">ファイル:</span>
                      <Badge variant="secondary">
                        {validationResult.spreadsheet.name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">シート:</span>
                      <Badge variant="secondary">{sheetName}</Badge>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationResult.error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}

