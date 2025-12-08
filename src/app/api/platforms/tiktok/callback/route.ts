import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getTikTokTokensFromCode, getTikTokAdAccounts } from '@/lib/tiktok/client';
import { encryptCredentials } from '@/lib/encryption';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { searchParams } = new URL(request.url);
    const authCode = searchParams.get('auth_code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    // TikTokからのエラーパラメータをチェック
    if (error) {
      console.error('TikTok OAuth error:', error);
      let returnTo = '/';
      if (stateParam) {
        try {
          const state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
          returnTo = state.returnTo || '/';
        } catch {
          console.error('Failed to parse state');
        }
      }
      
      const isPopup = returnTo.includes('popup=true');
      if (isPopup) {
        const cleanReturnTo = returnTo.replace(/[?&]popup=true/, '').replace(/popup=true[?&]/, '').replace(/popup=true$/, '');
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>認証エラー</title>
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
                <h2>認証がキャンセルされました</h2>
                <p>このウィンドウは自動的に閉じられます。</p>
              </div>
              <script>
                const returnTo = ${JSON.stringify(cleanReturnTo)};
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'oauth_error', 
                    platform: 'TIKTOK_ADS',
                    error: ${JSON.stringify(error)},
                    returnTo: returnTo
                  }, '*');
                  setTimeout(() => {
                    window.close();
                  }, 2000);
                } else {
                  window.location.href = returnTo + (returnTo.includes('?') ? '&' : '?') + 'error=tiktok_oauth_denied';
                }
              </script>
            </body>
          </html>
        `;
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      
      const redirectUrl = new URL(returnTo, request.url);
      redirectUrl.searchParams.set('error', 'tiktok_oauth_denied');
      return NextResponse.redirect(redirectUrl);
    }

    if (!authCode) {
      // authCodeがない場合も、returnToに戻る
      let returnTo = '/';
      if (stateParam) {
        try {
          const state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
          returnTo = state.returnTo || '/';
        } catch {
          console.error('Failed to parse state');
        }
      }
      
      const isPopup = returnTo.includes('popup=true');
      if (isPopup) {
        const cleanReturnTo = returnTo.replace(/[?&]popup=true/, '').replace(/popup=true[?&]/, '').replace(/popup=true$/, '');
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>認証エラー</title>
            </head>
            <body>
              <script>
                const returnTo = ${JSON.stringify(cleanReturnTo)};
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'oauth_error', 
                    platform: 'TIKTOK_ADS',
                    error: '認証コードが取得できませんでした',
                    returnTo: returnTo
                  }, '*');
                  setTimeout(() => {
                    window.close();
                  }, 2000);
                } else {
                  window.location.href = returnTo + (returnTo.includes('?') ? '&' : '?') + 'error=no_code';
                }
              </script>
            </body>
          </html>
        `;
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      
      const redirectUrl = new URL(returnTo, request.url);
      redirectUrl.searchParams.set('error', 'no_code');
      return NextResponse.redirect(redirectUrl);
    }

    let returnTo = '/';
    if (stateParam) {
      try {
        const state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
        returnTo = state.returnTo || '/';

        if (state.userId !== session.user.id) {
          // userIdが一致しない場合も、returnToに戻る（セッションを保持）
          const redirectUrl = new URL(returnTo, request.url);
          redirectUrl.searchParams.set('error', 'invalid_state');
          return NextResponse.redirect(redirectUrl);
        }
      } catch {
        console.error('Failed to parse state');
        // stateのパースに失敗した場合も、デフォルトのreturnToを使用
      }
    }

    const tokens = await getTikTokTokensFromCode(authCode);

    // アカウント情報を取得してアカウント名を取得
    let accountName: string | undefined;
    try {
      const adAccounts = await getTikTokAdAccounts(tokens.accessToken);
      const account = adAccounts.find(acc => acc.advertiserId === tokens.advertiserId);
      if (account) {
        accountName = account.advertiserName;
      }
    } catch (error) {
      console.warn('Failed to get TikTok ad accounts:', error);
      // アカウント情報の取得に失敗しても続行
    }

    const encryptedCredentials = encryptCredentials({
      accessToken: tokens.accessToken,
      accountName: accountName,
    });

    await prisma.platformAuthentication.upsert({
      where: {
        userId_platform_accountIdentifier: {
          userId: session.user.id,
          platform: 'TIKTOK_ADS',
          accountIdentifier: tokens.advertiserId,
        },
      },
      update: {
        encryptedCredentials,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        platform: 'TIKTOK_ADS',
        accountIdentifier: tokens.advertiserId,
        encryptedCredentials,
      },
    });

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
              console.log('TikTok OAuth callback page loaded');
              const returnTo = ${JSON.stringify(cleanReturnTo)};
              
              // 親ウィンドウに認証完了を通知
              if (window.opener && !window.opener.closed) {
                console.log('Sending message to opener');
                try {
                  // 複数のoriginを試す（セキュリティ制限を回避）
                  window.opener.postMessage({ 
                    type: 'oauth_success', 
                    platform: 'TIKTOK_ADS',
                    returnTo: returnTo
                  }, window.location.origin);
                  window.opener.postMessage({ 
                    type: 'oauth_success', 
                    platform: 'TIKTOK_ADS',
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
                    window.opener.location.href = returnTo + (returnTo.includes('?') ? '&' : '?') + 'tiktok_connected=true';
                  }
                  setTimeout(() => {
                    window.close();
                  }, 1000);
                }
              } else {
                console.log('No opener or opener closed, redirecting');
                // ポップアップが開かれていない場合は通常のリダイレクト
                window.location.href = returnTo + (returnTo.includes('?') ? '&' : '?') + 'tiktok_connected=true';
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
    redirectUrl.searchParams.set('tiktok_connected', 'true');

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
    
    // エラーが発生した場合でも、セッションを保持して元のページに戻る
    const errorMessage = error instanceof Error ? error.message : 'OAuth認証に失敗しました';
    
    // returnToが設定されている場合は、そこにエラーパラメータを付けてリダイレクト
    let returnTo = '/';
    try {
      const { searchParams } = new URL(request.url);
      const stateParam = searchParams.get('state');
      if (stateParam) {
        const state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
        returnTo = state.returnTo || '/';
      }
    } catch {
      // stateのパースに失敗した場合はデフォルトのreturnToを使用
    }
    
    // ポップアップウィンドウから開かれた場合
    const isPopup = returnTo.includes('popup=true');
    
    if (isPopup) {
      const cleanReturnTo = returnTo.replace(/[?&]popup=true/, '').replace(/popup=true[?&]/, '').replace(/popup=true$/, '');
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>認証エラー</title>
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
              <h2>認証エラー</h2>
              <p>${errorMessage}</p>
              <p>このウィンドウは自動的に閉じられます。</p>
            </div>
            <script>
              const returnTo = ${JSON.stringify(cleanReturnTo)};
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ 
                  type: 'oauth_error', 
                  platform: 'TIKTOK_ADS',
                  error: ${JSON.stringify(errorMessage)},
                  returnTo: returnTo
                }, '*');
                setTimeout(() => {
                  window.close();
                }, 2000);
              } else {
                window.location.href = returnTo + (returnTo.includes('?') ? '&' : '?') + 'error=tiktok_oauth_failed';
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
    redirectUrl.searchParams.set('error', 'tiktok_oauth_failed');
    redirectUrl.searchParams.set('message', encodeURIComponent(errorMessage));
    
    return NextResponse.redirect(redirectUrl);
  }
}

