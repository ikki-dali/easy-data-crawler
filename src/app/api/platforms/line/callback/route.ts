import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getLineTokensFromCode, getLineProfile } from '@/lib/line/client';
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
      console.error('LINE OAuth error:', error);
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

    const tokens = await getLineTokensFromCode(code);
    const profile = await getLineProfile(tokens.accessToken);

    const encryptedCredentials = encryptCredentials({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    await prisma.platformAuthentication.upsert({
      where: {
        userId_platform_accountIdentifier: {
          userId: session.user.id,
          platform: 'LINE_ADS',
          accountIdentifier: profile.displayName,
        },
      },
      update: {
        encryptedCredentials,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        platform: 'LINE_ADS',
        accountIdentifier: profile.displayName,
        encryptedCredentials,
      },
    });

    const redirectUrl = new URL(returnTo, request.url);
    redirectUrl.searchParams.set('line_connected', 'true');

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('LINE OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}

