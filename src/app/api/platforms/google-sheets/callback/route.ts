import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getGoogleTokensFromCode, getGoogleUserInfo } from '@/lib/google/client';
import { encryptCredentials } from '@/lib/encryption';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/?error=oauth_denied', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    // state をデコード
    let returnTo = '/';
    if (stateParam) {
      try {
        const state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
        returnTo = state.returnTo || '/';
        
        // セキュリティチェック: stateのuserIdとセッションのuserIdが一致するか
        if (state.userId !== session.user.id) {
          return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
        }
      } catch {
        console.error('Failed to parse state');
      }
    }

    // アクセストークンを取得
    const tokens = await getGoogleTokensFromCode(code);
    
    if (!tokens.access_token) {
      return NextResponse.redirect(new URL(`${returnTo}?error=no_token`, request.url));
    }

    // ユーザー情報を取得
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    // 認証情報を暗号化
    const encryptedCredentials = encryptCredentials({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date || undefined,
      tokenType: tokens.token_type || undefined,
      scope: tokens.scope || undefined,
    });

    // データベースに保存（既存のものは更新）
    await prisma.platformAuthentication.upsert({
      where: {
        userId_platform_accountIdentifier: {
          userId: session.user.id,
          platform: 'GOOGLE_SHEETS',
          accountIdentifier: userInfo.email || '',
        },
      },
      update: {
        encryptedCredentials,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        platform: 'GOOGLE_SHEETS',
        accountIdentifier: userInfo.email,
        encryptedCredentials,
      },
    });

    // 成功時のリダイレクト
    const redirectUrl = new URL(returnTo, request.url);
    redirectUrl.searchParams.set('google_connected', 'true');
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}

