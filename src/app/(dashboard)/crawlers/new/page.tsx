'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepIndicator } from '@/components/crawler/step-indicator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CRAWLER_STEPS, CrawlerFormData, initialFormData } from '@/types/crawler-form';
import { StepName } from '@/components/crawler/steps/step-name';
import { StepSpreadsheet } from '@/components/crawler/steps/step-spreadsheet';
import { StepPlatform } from '@/components/crawler/steps/step-platform';
import { StepAccounts } from '@/components/crawler/steps/step-accounts';
import { StepReport } from '@/components/crawler/steps/step-report';
import { StepSchedule } from '@/components/crawler/steps/step-schedule';
import { ArrowLeft, ArrowRight, Loader2, Save, Play } from 'lucide-react';
import { Sheet, AdAccount } from '@/types/crawler-form';
import { Platform } from '@/types/platform';
import { ReportConfig, ScheduleConfig } from '@/types/report';

export default function NewCrawlerPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<CrawlerFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.name.trim()) {
          newErrors.name = 'クローラー名を入力してください';
        } else if (formData.name.length > 100) {
          newErrors.name = 'クローラー名は100文字以内で入力してください';
        }
        break;
      case 1:
        if (!formData.spreadsheetUrl) {
          newErrors.spreadsheetUrl = 'スプレッドシートURLを入力してください';
        }
        if (!formData.sheetName) {
          newErrors.sheetName = 'シートを選択してください';
        }
        break;
      case 2:
        if (!formData.platform) {
          newErrors.platform = 'プラットフォームを選択してください';
        }
        break;
      case 3:
        if (formData.accountIds.length === 0) {
          newErrors.accountIds = '広告アカウントを選択してください';
        }
        break;
      case 4:
        if (formData.reportConfig.metrics.length === 0) {
          newErrors.metrics = 'メトリクスを選択してください';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => {
        if (prev.includes(currentStep)) return prev;
        return [...prev, currentStep];
      });
      setCurrentStep((prev) => Math.min(prev + 1, CRAWLER_STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/crawlers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          platform: formData.platform,
          spreadsheetUrl: formData.spreadsheetUrl,
          sheetName: formData.sheetName,
          accountIds: formData.accountIds,
          reportConfig: formData.reportConfig,
          scheduleConfig: formData.scheduleConfig,
          tags: formData.tags,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'クローラーの作成に失敗しました');
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'クローラーの作成に失敗しました'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const step = CRAWLER_STEPS[currentStep];

  // 各ステップのコンテンツをレンダリング
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepName
            name={formData.name}
            onChange={(name) => setFormData((prev) => ({ ...prev, name }))}
            error={errors.name}
          />
        );
      case 1:
        return (
          <StepSpreadsheet
            spreadsheetUrl={formData.spreadsheetUrl}
            spreadsheetId={formData.spreadsheetId}
            sheetName={formData.sheetName}
            availableSheets={formData.availableSheets}
            onChange={(data: {
              spreadsheetUrl: string;
              spreadsheetId: string;
              sheetName: string;
              availableSheets: Sheet[];
            }) => setFormData((prev) => ({ ...prev, ...data }))}
            errors={errors}
          />
        );
      case 2:
        return (
          <StepPlatform
            selectedPlatform={formData.platform}
            onSelect={(platform: Platform) =>
              setFormData((prev) => ({ ...prev, platform }))
            }
            error={errors.platform}
          />
        );
      case 3:
        if (!formData.platform) {
          return (
            <Alert>
              <AlertDescription>
                先にプラットフォームを選択してください。
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <StepAccounts
            platform={formData.platform}
            selectedAccountIds={formData.accountIds}
            onAccountsChange={(accountIds: string[], accounts: AdAccount[]) =>
              setFormData((prev) => ({
                ...prev,
                accountIds,
                availableAccounts: accounts,
              }))
            }
            error={errors.accountIds}
          />
        );
      case 4:
        if (!formData.platform) {
          return (
            <Alert>
              <AlertDescription>
                先にプラットフォームを選択してください。
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <StepReport
            platform={formData.platform}
            reportConfig={formData.reportConfig}
            onChange={(config: ReportConfig) =>
              setFormData((prev) => ({ ...prev, reportConfig: config }))
            }
            errors={errors}
          />
        );
      case 5:
        return (
          <StepSchedule
            scheduleConfig={formData.scheduleConfig}
            tags={formData.tags}
            onScheduleChange={(config: ScheduleConfig) =>
              setFormData((prev) => ({ ...prev, scheduleConfig: config }))
            }
            onTagsChange={(tags: string[]) =>
              setFormData((prev) => ({ ...prev, tags }))
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">新規クローラー作成</h1>

      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{step.title}</CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* エラー表示 */}
          {submitError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* ステップコンテンツ */}
          <div className="min-h-[300px]">{renderStepContent()}</div>

          {/* ナビゲーション */}
          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>

            <div className="flex gap-2">
              {currentStep === CRAWLER_STEPS.length - 1 ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={isSubmitting}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    テスト実行
                  </Button>
                  <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? (
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
                </>
              ) : (
                <Button onClick={handleNext}>
                  次へ
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

