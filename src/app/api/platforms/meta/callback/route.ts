import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getMetaTokensFromCode, exchangeForLongLivedToken, getMetaUserInfo, getMetaAdAccounts } from '@/lib/meta/client';
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
      console.error('Meta OAuth error:', error);
      const returnTo = stateParam 
        ? JSON.parse(Buffer.from(stateParam, 'base64').toString()).returnTo || '/'
        : '/';
      const isPopup = returnTo.includes('/crawlers/new');
      
      if (isPopup) {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>認証エラー</title>
            </head>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'oauth_error', platform: 'META_ADS', error: '${error}' }, '*');
                  window.close();
                } else {
                  window.location.href = '/?error=oauth_denied';
                }
              </script>
              <p>認証がキャンセルされました。このウィンドウは自動的に閉じられます。</p>
            </body>
          </html>
        `;
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      
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

    // 短期トークンを取得
    const shortLivedTokens = await getMetaTokensFromCode(code);

    // 長期トークンに交換
    const longLivedTokens = await exchangeForLongLivedToken(shortLivedTokens.accessToken);

    // ユーザー情報を取得
    const userInfo = await getMetaUserInfo(longLivedTokens.accessToken);

    // 広告アカウント一覧を取得
    const adAccounts = await getMetaAdAccounts(longLivedTokens.accessToken);

    // 各広告アカウントごとにPlatformAuthenticationレコードを作成/更新
    for (const account of adAccounts) {
      const encryptedCredentials = encryptCredentials({
        accessToken: longLivedTokens.accessToken,
        expiresAt: Date.now() + longLivedTokens.expiresIn * 1000,
        accountId: account.accountId,
        accountName: account.name,
      });

      await prisma.platformAuthentication.upsert({
        where: {
          userId_platform_accountIdentifier: {
            userId: session.user.id,
            platform: 'META_ADS',
            accountIdentifier: account.accountId,
          },
        },
        update: {
          encryptedCredentials,
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          platform: 'META_ADS',
          accountIdentifier: account.accountId,
          encryptedCredentials,
        },
      });
    }

    // 広告アカウントがない場合でも、ユーザーアカウントとして保存
    if (adAccounts.length === 0) {
      const encryptedCredentials = encryptCredentials({
        accessToken: longLivedTokens.accessToken,
        expiresAt: Date.now() + longLivedTokens.expiresIn * 1000,
      });

      await prisma.platformAuthentication.upsert({
        where: {
          userId_platform_accountIdentifier: {
            userId: session.user.id,
            platform: 'META_ADS',
            accountIdentifier: userInfo.id,
          },
        },
        update: {
          encryptedCredentials,
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          platform: 'META_ADS',
          accountIdentifier: userInfo.id,
          encryptedCredentials,
        },
      });
    }

    // ポップアップウィンドウから開かれた場合（returnToに/crawlers/newが含まれる）
    const isPopup = returnTo.includes('/crawlers/new');
    
    if (isPopup) {
      // ポップアップウィンドウにHTMLを返して、親ウィンドウにメッセージを送る
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>認証完了</title>
          </head>
          <body>
            <script>
              // 親ウィンドウに認証完了を通知
              if (window.opener) {
                window.opener.postMessage({ type: 'oauth_success', platform: 'META_ADS' }, '*');
                window.close();
              } else {
                // ポップアップが開かれていない場合は通常のリダイレクト
                window.location.href = '${returnTo}?meta_connected=true';
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
    redirectUrl.searchParams.set('meta_connected', 'true');

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}

