import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getGoogleAdsTokensFromCode } from '@/lib/google/ads-client';
import { getGoogleUserInfo } from '@/lib/google/client';
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
      console.error('Google Ads OAuth error:', error);
      return NextResponse.redirect(new URL('/?error=oauth_denied', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    let returnTo = '/';
    if (stateParam) {
      try {
        const state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
        returnTo = state.returnTo || '/';

        if (state.userId !== session.user.id) {
          return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
        }
      } catch {
        console.error('Failed to parse state');
      }
    }

    const tokens = await getGoogleAdsTokensFromCode(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL(`${returnTo}?error=no_token`, request.url));
    }

    // ユーザー情報を取得（Google OAuth共通）
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    const encryptedCredentials = encryptCredentials({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date || undefined,
      tokenType: tokens.token_type || undefined,
      scope: tokens.scope || undefined,
    });

    await prisma.platformAuthentication.upsert({
      where: {
        userId_platform_accountIdentifier: {
          userId: session.user.id,
          platform: 'GOOGLE_ADS',
          accountIdentifier: userInfo.email || '',
        },
      },
      update: {
        encryptedCredentials,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        platform: 'GOOGLE_ADS',
        accountIdentifier: userInfo.email,
        encryptedCredentials,
      },
    });

    const redirectUrl = new URL(returnTo, request.url);
    redirectUrl.searchParams.set('google_ads_connected', 'true');

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Google Ads OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}

