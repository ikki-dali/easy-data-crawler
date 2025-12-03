# 2-2: ユーザー登録API

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 2-2 |
| **複雑度** | Simple |
| **見積もり** | 2時間 |
| **依存** | 2-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

ユーザー登録APIを作成し、Zodによるバリデーションを実装する。

## タスク

- [ ] 登録APIエンドポイント作成
- [ ] Zodスキーマ定義
- [ ] パスワードハッシュ化
- [ ] 重複チェック
- [ ] エラーハンドリング

## 実装詳細

### Zodスキーマ

```typescript
// src/lib/validations/auth.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'パスワードは英字と数字を含めてください'
    ),
  name: z
    .string()
    .min(1, '名前を入力してください')
    .max(100, '名前は100文字以内で入力してください'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

### API エンドポイント

```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { registerSchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    // 重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: '登録が完了しました', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '登録に失敗しました。しばらくしてからお試しください' },
      { status: 500 }
    );
  }
}
```

### APIクライアント

```typescript
// src/lib/api/auth.ts
import { RegisterInput, LoginInput } from '@/lib/validations/auth';

export async function registerUser(data: RegisterInput) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || '登録に失敗しました');
  }

  return result;
}
```

## 完了条件

- [ ] POST /api/auth/register が動作する
- [ ] バリデーションが機能する
- [ ] 重複メールアドレスがエラーになる
- [ ] パスワードがハッシュ化されて保存される
- [ ] エラーメッセージが適切に返される

## 参考リソース

- [Zod Documentation](https://zod.dev/)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)

