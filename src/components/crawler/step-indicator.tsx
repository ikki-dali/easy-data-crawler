'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { CRAWLER_STEPS } from '@/types/crawler-form';

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
}

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* デスクトップ表示 */}
      <div className="hidden md:flex items-center justify-center">
        {CRAWLER_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                  currentStep === index
                    ? 'border-primary bg-primary text-white'
                    : completedSteps.includes(index)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-300 text-gray-500'
                )}
              >
                {completedSteps.includes(index) ? (
                  <Check className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium',
                  currentStep === index ? 'text-primary' : 'text-gray-500'
                )}
              >
                {step.title}
              </span>
            </div>
            {index < CRAWLER_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-1 w-16 mx-2',
                  completedSteps.includes(index) ? 'bg-primary' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* モバイル表示 */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            ステップ {currentStep + 1} / {CRAWLER_STEPS.length}
          </span>
          <span className="text-sm text-gray-500">
            {CRAWLER_STEPS[currentStep].title}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{
              width: `${((currentStep + 1) / CRAWLER_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

