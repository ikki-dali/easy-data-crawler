import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getXTokensFromCode, getXUserInfo } from '@/lib/x/client';
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
      console.error('X OAuth error:', error);
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

    const tokens = await getXTokensFromCode(code);
    const userInfo = await getXUserInfo(tokens.accessToken);

    const encryptedCredentials = encryptCredentials({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    await prisma.platformAuthentication.upsert({
      where: {
        userId_platform_accountIdentifier: {
          userId: session.user.id,
          platform: 'X_ADS',
          accountIdentifier: userInfo.username,
        },
      },
      update: {
        encryptedCredentials,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        platform: 'X_ADS',
        accountIdentifier: userInfo.username,
        encryptedCredentials,
      },
    });

    // ポップアップウィンドウから開かれた場合
    const isPopup = returnTo.includes('/crawlers/new');
    
    if (isPopup) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>認証完了</title>
          </head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'oauth_success', platform: 'X_ADS' }, '*');
                window.close();
              } else {
                window.location.href = '${returnTo}?x_connected=true';
              }
            </script>
            <p>認証が完了しました。このウィンドウは自動的に閉じられます。</p>
          </body>
        </html>
      `;
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const redirectUrl = new URL(returnTo, request.url);
    redirectUrl.searchParams.set('x_connected', 'true');

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('X OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}

