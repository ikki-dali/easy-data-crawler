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
        userEmail: userInfo.email,
        userName: userInfo.name,
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
        userEmail: userInfo.email,
        userName: userInfo.name,
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

    // ポップアップウィンドウから開かれた場合（returnToにpopup=trueが含まれる）
    const isPopup = returnTo.includes('popup=true');
    
    if (isPopup) {
      // returnToからpopup=trueを削除して、実際のリダイレクト先URLを取得
      const cleanReturnTo = returnTo.replace(/[?&]popup=true/, '').replace(/popup=true[?&]/, '').replace(/popup=true$/, '');
      
      // ポップアップウィンドウにHTMLを返して、親ウィンドウにメッセージを送る
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>認証完了</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>認証が完了しました</h2>
              <p>このウィンドウは自動的に閉じられます。</p>
            </div>
            <script>
              console.log('OAuth callback page loaded');
              const returnTo = ${JSON.stringify(cleanReturnTo)};
              
              // 親ウィンドウに認証完了を通知
              if (window.opener && !window.opener.closed) {
                console.log('Sending message to opener');
                try {
                  // 複数のoriginを試す（セキュリティ制限を回避）
                  window.opener.postMessage({ 
                    type: 'oauth_success', 
                    platform: 'META_ADS',
                    returnTo: returnTo
                  }, window.location.origin);
                  window.opener.postMessage({ 
                    type: 'oauth_success', 
                    platform: 'META_ADS',
                    returnTo: returnTo
                  }, '*');
                  console.log('Message sent successfully');
                  setTimeout(() => {
                    window.close();
                  }, 1000);
                } catch (e) {
                  console.error('Failed to send message:', e);
                  // メッセージ送信に失敗した場合は、親ウィンドウをリダイレクト
                  if (window.opener && !window.opener.closed) {
                    window.opener.location.href = returnTo + (returnTo.includes('?') ? '&' : '?') + 'meta_connected=true';
                  }
                  setTimeout(() => {
                    window.close();
                  }, 1000);
                }
              } else {
                console.log('No opener or opener closed, redirecting');
                // ポップアップが開かれていない場合は通常のリダイレクト
                window.location.href = returnTo + (returnTo.includes('?') ? '&' : '?') + 'meta_connected=true';
              }
            </script>
          </body>
        </html>
      `;
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 通常のリダイレクト（ポップアップでない場合）
    const redirectUrl = new URL(returnTo, request.url);
    redirectUrl.searchParams.set('meta_connected', 'true');

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }
}

