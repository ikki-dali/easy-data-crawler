import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const localhostUri = 'http://localhost:3000/api/platforms/meta/callback';
    
    // 本番環境のURL（環境変数から取得）
    let productionUrl = process.env.NEXTAUTH_URL;
    
    // NEXTAUTH_URLがない場合、VERCEL_URLから生成
    if (!productionUrl && process.env.VERCEL_URL) {
      // VERCEL_URLは既にドメインのみ（例: easy-data-crawler.vercel.app）
      productionUrl = `https://${process.env.VERCEL_URL}`;
    }
    
    // どちらもない場合はデフォルト値（本番環境のURL）
    if (!productionUrl) {
      productionUrl = 'https://easy-data-crawler.vercel.app';
    }
    
    // 本番環境のURLを確実に設定（環境変数が設定されていない場合でも表示できるように）
    const defaultProductionUrl = 'https://easy-data-crawler.vercel.app';
    
    // URLがhttp://で始まらない場合はhttps://を追加
    if (!productionUrl.startsWith('http://') && !productionUrl.startsWith('https://')) {
      productionUrl = `https://${productionUrl}`;
    }
    
    const productionUri = `${productionUrl}/api/platforms/meta/callback`;
    const defaultProductionUri = `${defaultProductionUrl}/api/platforms/meta/callback`;

    return NextResponse.json({
      localhost: localhostUri,
      production: productionUri,
      productionUrl: productionUrl,
      defaultProduction: defaultProductionUri,
      defaultProductionUrl: defaultProductionUrl,
    });
  } catch (error) {
    console.error('Redirect URI error:', error);
    return NextResponse.json(
      { error: 'リダイレクトURIの取得に失敗しました' },
      { status: 500 }
    );
  }
}

