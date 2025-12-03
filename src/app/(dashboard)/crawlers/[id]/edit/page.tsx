'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { StepName } from '@/components/crawler/steps/step-name';
import { StepSpreadsheet } from '@/components/crawler/steps/step-spreadsheet';
import { StepPlatform } from '@/components/crawler/steps/step-platform';
import { StepAccounts } from '@/components/crawler/steps/step-accounts';
import { StepReport } from '@/components/crawler/steps/step-report';
import { StepSchedule } from '@/components/crawler/steps/step-schedule';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Platform } from '@/types/platform';
import { ReportConfig, ScheduleConfig } from '@/types/report';
import { Sheet, AdAccount } from '@/types/crawler-form';

interface CrawlerDetail {
  id: string;
  name: string;
  platform: Platform;
  status: 'ACTIVE' | 'INACTIVE';
  spreadsheetUrl: string;
  spreadsheetId: string;
  sheetName: string;
  accountIds: string[];
  reportConfig: ReportConfig;
  scheduleConfig: ScheduleConfig;
  tags: string[];
}

export default function EditCrawlerPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const crawlerId = params.id as string;

  const [formData, setFormData] = useState<{
    name: string;
    platform: Platform | null;
    spreadsheetUrl: string;
    spreadsheetId: string;
    sheetName: string;
    availableSheets: Sheet[];
    accountIds: string[];
    availableAccounts: AdAccount[];
    reportConfig: ReportConfig;
    scheduleConfig: ScheduleConfig;
    tags: string[];
  } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // クローラー詳細を取得
  const { data: crawler, isLoading } = useQuery<CrawlerDetail>({
    queryKey: ['crawler', crawlerId],
    queryFn: async () => {
      const res = await fetch(`/api/crawlers/${crawlerId}`);
      if (!res.ok) throw new Error('Failed to fetch crawler');
      return res.json();
    },
  });

  // 初期データをセット
  useEffect(() => {
    if (crawler && !formData) {
      setFormData({
        name: crawler.name,
        platform: crawler.platform,
        spreadsheetUrl: crawler.spreadsheetUrl,
        spreadsheetId: crawler.spreadsheetId,
        sheetName: crawler.sheetName,
        availableSheets: [{ sheetId: 0, title: crawler.sheetName }],
        accountIds: crawler.accountIds,
        availableAccounts: crawler.accountIds.map((id) => ({ id, name: id })),
        reportConfig: crawler.reportConfig,
        scheduleConfig: crawler.scheduleConfig,
        tags: crawler.tags,
      });
    }
  }, [crawler, formData]);

  // 更新ミューテーション
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CrawlerDetail>) => {
      const res = await fetch(`/api/crawlers/${crawlerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '更新に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawler', crawlerId] });
      queryClient.invalidateQueries({ queryKey: ['crawlers'] });
      router.push(`/crawlers/${crawlerId}`);
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    },
  });

  const handleSave = () => {
    if (!formData) return;

    // バリデーション
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'クローラー名を入力してください';
    }
    if (!formData.spreadsheetUrl) {
      newErrors.spreadsheetUrl = 'スプレッドシートURLを入力してください';
    }
    if (!formData.platform) {
      newErrors.platform = 'プラットフォームを選択してください';
    }
    if (formData.accountIds.length === 0) {
      newErrors.accountIds = '広告アカウントを選択してください';
    }
    if (formData.reportConfig.metrics.length === 0) {
      newErrors.metrics = 'メトリクスを選択してください';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    updateMutation.mutate({
      name: formData.name,
      platform: formData.platform!,
      spreadsheetUrl: formData.spreadsheetUrl,
      sheetName: formData.sheetName,
      accountIds: formData.accountIds,
      reportConfig: formData.reportConfig,
      scheduleConfig: formData.scheduleConfig,
      tags: formData.tags,
    });
  };

  if (isLoading || !formData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/crawlers/${crawlerId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">クローラーを編集</h1>
          <p className="text-muted-foreground">{crawler?.name}</p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="output">出力先</TabsTrigger>
          <TabsTrigger value="source">データソース</TabsTrigger>
          <TabsTrigger value="report">レポート</TabsTrigger>
          <TabsTrigger value="schedule">スケジュール</TabsTrigger>
        </TabsList>

        {/* 基本情報 */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>クローラーの名前を設定</CardDescription>
            </CardHeader>
            <CardContent>
              <StepName
                name={formData.name}
                onChange={(name) => setFormData((prev) => prev && { ...prev, name })}
                error={errors.name}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 出力先 */}
        <TabsContent value="output">
          <Card>
            <CardHeader>
              <CardTitle>出力先</CardTitle>
              <CardDescription>スプレッドシートの設定</CardDescription>
            </CardHeader>
            <CardContent>
              <StepSpreadsheet
                spreadsheetUrl={formData.spreadsheetUrl}
                spreadsheetId={formData.spreadsheetId}
                sheetName={formData.sheetName}
                availableSheets={formData.availableSheets}
                onChange={(data) =>
                  setFormData((prev) => prev && { ...prev, ...data })
                }
                errors={errors}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* データソース */}
        <TabsContent value="source">
          <Card>
            <CardHeader>
              <CardTitle>データソース</CardTitle>
              <CardDescription>プラットフォームとアカウントの設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">プラットフォーム</h4>
                <StepPlatform
                  selectedPlatform={formData.platform}
                  onSelect={(platform) =>
                    setFormData((prev) => prev && { ...prev, platform })
                  }
                  error={errors.platform}
                />
              </div>
              {formData.platform && (
                <div>
                  <h4 className="font-medium mb-4">広告アカウント</h4>
                  <StepAccounts
                    platform={formData.platform}
                    selectedAccountIds={formData.accountIds}
                    onAccountsChange={(accountIds, accounts) =>
                      setFormData((prev) =>
                        prev && { ...prev, accountIds, availableAccounts: accounts }
                      )
                    }
                    error={errors.accountIds}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* レポート設定 */}
        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>レポート設定</CardTitle>
              <CardDescription>取得するデータの設定</CardDescription>
            </CardHeader>
            <CardContent>
              {formData.platform ? (
                <StepReport
                  platform={formData.platform}
                  reportConfig={formData.reportConfig}
                  onChange={(reportConfig) =>
                    setFormData((prev) => prev && { ...prev, reportConfig })
                  }
                  errors={errors}
                />
              ) : (
                <p className="text-muted-foreground">
                  先にプラットフォームを選択してください
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* スケジュール */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>スケジュール・タグ</CardTitle>
              <CardDescription>実行頻度とタグの設定</CardDescription>
            </CardHeader>
            <CardContent>
              <StepSchedule
                scheduleConfig={formData.scheduleConfig}
                tags={formData.tags}
                onScheduleChange={(scheduleConfig) =>
                  setFormData((prev) => prev && { ...prev, scheduleConfig })
                }
                onTagsChange={(tags) =>
                  setFormData((prev) => prev && { ...prev, tags })
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" asChild>
          <Link href={`/crawlers/${crawlerId}`}>キャンセル</Link>
        </Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

