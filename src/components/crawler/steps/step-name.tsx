'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepNameProps {
  name: string;
  onChange: (name: string) => void;
  error?: string;
}

export function StepName({ name, onChange, error }: StepNameProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">クローラー名 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="例: Meta広告_日次レポート"
          maxLength={100}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <p className="text-xs text-muted-foreground">
          {name.length} / 100 文字
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        クローラーを識別するための名前を入力してください。後から変更できます。
      </p>
    </div>
  );
}

