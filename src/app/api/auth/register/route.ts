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
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || 'バリデーションエラー' },
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

