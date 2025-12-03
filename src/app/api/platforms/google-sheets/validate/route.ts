import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { validateSpreadsheetAccess } from '@/lib/google/sheets';
import { z } from 'zod';

const validateSchema = z.object({
  url: z.string().url('有効なURLを入力してください'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { url } = validateSchema.parse(body);

    const result = await validateSpreadsheetAccess(session.user.id, url);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      spreadsheet: result.info,
    });
  } catch (error) {
    console.error('Validate spreadsheet error:', error);
    
    if (error instanceof z.ZodError) {
      const issues = error.issues;
      const errorMessage = issues[0]?.message || 'バリデーションエラー';
      return NextResponse.json(
        { valid: false, error: errorMessage },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Google認証')) {
        return NextResponse.json(
          { valid: false, error: 'Google認証が必要です', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { valid: false, error: '検証に失敗しました' },
      { status: 500 }
    );
  }
}

