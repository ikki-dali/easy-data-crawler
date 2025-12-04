# プラットフォーム連携セットアップガイド

各広告プラットフォームと連携するために、開発者コンソールでアプリを作成し、認証情報を取得する必要があります。

## 📋 必要な環境変数

各プラットフォームの認証情報を`.env`ファイル（開発環境）またはVercelの環境変数（本番環境）に設定してください：

### 開発環境（.envファイル）

```env
# NextAuth基本設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Meta (Facebook/Instagram) Ads
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_REDIRECT_URI=http://localhost:3000/api/platforms/meta/callback

# TikTok Ads
TIKTOK_APP_ID=your-tiktok-app-id
TIKTOK_APP_SECRET=your-tiktok-app-secret
TIKTOK_REDIRECT_URI=http://localhost:3000/api/platforms/tiktok/callback

# X (Twitter) Ads
X_API_KEY=your-x-api-key
X_API_SECRET=your-x-api-secret
X_BEARER_TOKEN=your-x-bearer-token
X_REDIRECT_URI=http://localhost:3000/api/platforms/x/callback

# Google Sheets
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/platforms/google-sheets/callback

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_CLIENT_CUSTOMER_ID=your-client-customer-id
```

### 本番環境（Vercel環境変数）

Vercel Dashboard → Settings → Environment Variables で以下を設定：

```env
# NextAuth基本設定
NEXTAUTH_URL=https://easy-data-crawler.vercel.app
NEXTAUTH_SECRET=your-secret-key

# Meta (Facebook/Instagram) Ads
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_REDIRECT_URI=https://easy-data-crawler.vercel.app/api/platforms/meta/callback

# TikTok Ads
TIKTOK_APP_ID=your-tiktok-app-id
TIKTOK_APP_SECRET=your-tiktok-app-secret
TIKTOK_REDIRECT_URI=https://easy-data-crawler.vercel.app/api/platforms/tiktok/callback

# X (Twitter) Ads
X_API_KEY=your-x-api-key
X_API_SECRET=your-x-api-secret
X_BEARER_TOKEN=your-x-bearer-token
X_REDIRECT_URI=https://easy-data-crawler.vercel.app/api/platforms/x/callback

# Google Sheets
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://easy-data-crawler.vercel.app/api/platforms/google-sheets/callback

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_CLIENT_CUSTOMER_ID=your-client-customer-id
```

⚠️ **注意**: Vercelのプロジェクト名が異なる場合は、`easy-data-crawler` の部分を実際のプロジェクト名に置き換えてください。

---

## 🔵 Meta (Facebook/Instagram) Ads

### 1. Facebook Developers でアプリを作成

1. **Facebook Developers** にアクセス
   - https://developers.facebook.com/

2. **「アプリを作成」** をクリック

3. **アプリの種類を選択**
   - 「ビジネス」を選択

4. **アプリ情報を入力**
   - アプリ名: `Easy Data Crawler`（任意）
   - アプリの連絡先メール: あなたのメールアドレス
   - アプリの目的: `ビジネスツール` または `マーケティングツール`
   - アプリの説明（任意）:
     ```
     Easy Data Crawler is a marketing automation tool that helps businesses streamline their advertising data reporting workflow. The application automatically retrieves Meta (Facebook/Instagram) advertising campaign performance data including impressions, clicks, spend, conversions, and other key metrics from multiple ad accounts. This data is then exported to Google Spreadsheets in a structured format, enabling marketing teams to easily track campaign performance, generate reports, and make data-driven decisions.
     ```

5. **「Marketing API」を追加**
   - ダッシュボード → 「製品を追加」→ 「Marketing API」

### 1-1. ビジネスアカウントの設定（推奨）

広告アカウントを管理するために、Meta Business Suiteの設定も推奨されます：

1. **Meta Business Suite** にアクセス
   - https://business.facebook.com/

2. **ビジネスアカウントを作成**（まだの場合）
   - ビジネス名を入力
   - ビジネスの種類を選択

3. **広告アカウントを追加**
   - 既存の広告アカウントを追加、または新規作成

### 2. 認証情報を取得

1. **設定 → 基本設定** に移動
   - **アプリID** をコピー → `META_APP_ID`
   - **アプリシークレット** を表示してコピー → `META_APP_SECRET`

2. **設定 → 基本設定 → プラットフォーム追加 → ウェブサイト**
   - サイトURL: `http://localhost:3000`

### 3. リダイレクトURIを設定

⚠️ **重要**: デプロイ後の本番URLを設定してください。後から変更するのは面倒です。

1. **Facebook ログイン → 設定**
   - **有効なOAuthリダイレクトURI** に追加:
     ```
     https://easy-data-crawler.vercel.app/api/platforms/meta/callback
     ```
   - Vercelにデプロイする場合の例: `https://easy-data-crawler.vercel.app/api/platforms/meta/callback`
   - カスタムドメインの場合: `https://app.easydatacrawler.com/api/platforms/meta/callback`
   - 開発環境でテストする場合は、追加で以下も登録:
     ```
     http://localhost:3000/api/platforms/meta/callback
     ```

2. **Marketing API → 設定**
   - **承認済みリダイレクトURI** に追加:
     ```
     https://easy-data-crawler.vercel.app/api/platforms/meta/callback
     ```
   - Vercelにデプロイする場合の例: `https://easy-data-crawler.vercel.app/api/platforms/meta/callback`
   - カスタムドメインの場合: `https://app.easydatacrawler.com/api/platforms/meta/callback`
   - 開発環境でテストする場合は、追加で以下も登録:
     ```
     http://localhost:3000/api/platforms/meta/callback
     ```

### 4. 必要な権限（スコープ）

- `ads_management`
- `ads_read`
- `business_management`

---

## 🎵 TikTok Ads

### 0. 開発者プロフィールの申請（必須）

⚠️ **重要**: アプリを作成する前に、開発者プロフィールの申請が必要です。

1. **TikTok For Business Developer Portal** にアクセス
   - https://business-api.tiktok.com/portal/apps

2. **開発者プロフィールを申請**
   - プロフィール情報を正確に入力
   - 会社情報、連絡先、ウェブサイトなどを入力
   - 審査には数日〜1週間かかる場合があります

3. **プロフィール申請が承認されるまで待つ**
   - 承認されないとアプリを作成できません
   - 拒否された場合は、理由を確認して再申請してください

#### プロフィール申請のコツ

- **会社情報を正確に入力**: 実在する会社名、住所、電話番号を使用
- **ウェブサイトURL**: 実在するウェブサイトを入力（例: `https://forestdali.co.jp/`）
- **説明文を充実**: ビジネスの目的やサービス内容を詳しく記載
- **連絡先情報**: 実際に連絡可能なメールアドレスと電話番号を使用

### 1. TikTok For Business Developer Portal でアプリを作成

**開発者プロフィールが承認された後**に以下を実行：

1. **TikTok For Business Developer Portal** にアクセス
   - https://business-api.tiktok.com/portal/apps

2. **「Create App」** をクリック

3. **アプリ基本情報を入力**
   - **App name**: `Easy Data Crawler`（50文字以内）
   - **App description**: 以下の説明文を入力（500文字以内）
     ```
     Easy Data Crawler is a marketing automation tool that helps businesses streamline their advertising data reporting workflow. The application automatically retrieves TikTok advertising campaign performance data including impressions, clicks, spend, conversions, and other key metrics from multiple ad accounts. This data is then exported to Google Spreadsheets in a structured format, enabling marketing teams to easily track campaign performance, generate reports, and make data-driven decisions. The tool eliminates manual data collection processes and saves valuable time for marketing professionals.
     ```
   - **Advertiser redirect URL**: 
     ```
     https://easy-data-crawler.vercel.app/api/platforms/tiktok/callback
     ```
     ⚠️ **重要**: デプロイ後の本番URLを設定してください。後から変更するのは面倒です。
     - Vercelにデプロイする場合の例: `https://easy-data-crawler.vercel.app/api/platforms/tiktok/callback`
     - カスタムドメインの場合: `https://app.easydatacrawler.com/api/platforms/tiktok/callback`
     - 開発環境でテストする場合は、後で追加のリダイレクトURIとして `http://localhost:3000/api/platforms/tiktok/callback` を追加できます

4. **「Marketing API」を選択**

### 2. 追加情報フォームの入力（必須項目）

アプリ作成時に表示される「Additional Information」フォームに以下を入力してください：

#### 必須項目

1. **Company Name**（会社名）
   - 例: `株式会社Forest Dali`
   - 個人の場合は個人名でもOK

2. **Company Website**（会社ウェブサイト）
   - 例: `https://forestdali.co.jp/`
   - 個人の場合は個人サイトやGitHubページでもOK

3. **Primary Developer Location**（開発者の主な所在地）
   - `Japan` を選択

4. **What services do you provide?**（提供するサービス）
   - 例: `Marketing Tools` または `Data Analytics`
   - 該当するものを選択

5. **What verticals do you specialize in?**（専門分野）
   - 例: `Technology` または `Marketing`
   - 該当するものを選択

6. **What region(s) do you serve?**（サービス提供地域）
   - 例: `Asia Pacific` または `Global`
   - 該当するものを選択

7. **What is your estimated yearly revenue from TikTok?**（TikTokからの年間収益見積もり）
   - 数値を入力（USD）
   - 例: `10000`（$10,000）
   - 実際の金額でなくてもOK、見積もりで問題ありません

8. **In English, please describe how you plan to use TikTok data and/or APIs.**（TikTokデータ/APIの使用目的を英語で説明）
   - 以下のような内容を入力：
     ```
     We are building a data crawler tool that automatically retrieves TikTok advertising campaign performance data (impressions, clicks, spend, conversions, etc.) and exports it to Google Spreadsheets for reporting and analysis purposes. This tool helps marketing teams automate their reporting workflow and track campaign performance across multiple TikTok ad accounts.
     ```

#### 任意項目

- **Please list our top 5 mutual clients.**（共通クライアント上位5社）
  - 該当する場合は入力、なければ空欄でもOK

### 2-1. Scope of Permission（権限スコープ）の設定

アプリ作成フォームの「Scope of permission」セクションで、以下の権限を選択してください：

#### 必須の権限

1. **Ad Account Management**（広告アカウント管理）
   - ✅ チェックを入れる
   - 用途: 広告アカウント一覧の取得、アカウント情報の取得
   - 必要なAPI:
     - `/oauth2/advertiser/get/` - 広告アカウント一覧取得
     - `/advertiser/info/` - アカウント情報取得

2. **Reporting**（レポート）
   - ✅ チェックを入れる
   - 用途: 広告キャンペーンのパフォーマンスデータ取得
   - 必要なAPI:
     - `/report/integrated/get/` - 統合レポート取得
     - `/report/audience/get/` - オーディエンスレポート取得

3. **Ads Management**（広告管理）
   - ✅ チェックを入れる（推奨）
   - 用途: 広告キャンペーン、広告グループ、広告の情報取得
   - 必要なAPI:
     - `/campaign/get/` - キャンペーン取得
     - `/adgroup/get/` - 広告グループ取得
     - `/ad/get/` - 広告取得

#### オプションの権限

4. **Audience Management**（オーディエンス管理）
   - オプション: オーディエンスデータが必要な場合のみ
   
5. **Creative Management**（クリエイティブ管理）
   - オプション: クリエイティブ情報が必要な場合のみ

6. **Measurement**（測定）
   - オプション: 詳細な測定データが必要な場合のみ

#### 権限設定の手順

1. **「Scope of permission」セクション** に移動
2. 左側のカテゴリリストから以下を選択：
   - ✅ **Ad Account Management**
   - ✅ **Reporting**
   - ✅ **Ads Management**
3. 各カテゴリを選択すると、右側にAPIエンドポイントの一覧が表示されます
4. 必要なAPIエンドポイントが含まれていることを確認
5. **API Version** は `v1.3` を選択（最新版）

### 3. 認証情報を取得

1. **アプリ詳細ページ** に移動
   - **App ID** をコピー → `TIKTOK_APP_ID`
   - **App Secret** をコピー → `TIKTOK_APP_SECRET`

### 4. リダイレクトURIの確認

アプリ作成時に「Advertiser redirect URL」を設定済みの場合は、このステップはスキップできます。

追加でリダイレクトURIを設定する場合：

1. **Settings → Redirect URI** に移動
   - Vercelにデプロイする場合:
     ```
     https://easy-data-crawler.vercel.app/api/platforms/tiktok/callback
     ```
   - カスタムドメインの場合:
     ```
     https://app.easydatacrawler.com/api/platforms/tiktok/callback
     ```
   - 開発環境でテストする場合は、追加で以下も登録:
     ```
     http://localhost:3000/api/platforms/tiktok/callback
     ```

### 5. 必要な権限（まとめ）

アプリ作成時に選択した権限スコープに対応するAPI権限：

- **Ad Account Management** - 広告アカウント管理
  - `/oauth2/advertiser/get/` - 広告アカウント一覧取得
  - `/advertiser/info/` - アカウント情報取得

- **Reporting** - レポート取得
  - `/report/integrated/get/` - 統合レポート取得
  - `/report/audience/get/` - オーディエンスレポート取得

- **Ads Management** - 広告管理
  - `/campaign/get/` - キャンペーン取得
  - `/adgroup/get/` - 広告グループ取得
  - `/ad/get/` - 広告取得

これらの権限により、広告アカウントのデータを取得してGoogle Sheetsに出力できます。

### 6. 審査について

- アプリ作成後、TikTokによる審査が行われる場合があります
- 審査が完了するまで数日かかる場合があります
- 審査中でも開発環境でのテストは可能な場合があります

### 7. プロフィール申請が拒否された場合

プロフィール申請が拒否された場合は、以下を確認してください：

1. **拒否理由を確認**
   - メールまたはポータルで拒否理由を確認
   - 不足している情報や不正確な情報を特定

2. **情報を修正して再申請**
   - 会社情報、連絡先、ウェブサイトURLなどを確認
   - より詳細な説明を追加
   - 実在する会社情報を使用

3. **よくある拒否理由**
   - 会社情報が不正確または不完全
   - ウェブサイトURLが無効または存在しない
   - 説明文が不十分
   - 連絡先情報が無効

4. **再申請時の注意点**
   - 前回の申請内容を改善して再提出
   - より詳細な情報を提供
   - 実在する会社情報を使用することを推奨

---

## 🐦 X (Twitter) Ads

### 1. X Developer Portal でアプリを作成

1. **X Developer Portal** にアクセス
   - https://developer.x.com/

2. **「Create App」** をクリック

3. **アプリ情報を入力**
   - App name: `Easy Data Crawler`
   - App environment: `Development`（開発中）または `Production`（本番）
   - App description: `A tool to export X advertising campaign data to Google Spreadsheets`

### 2. アプリの詳細設定

1. **App settings** に移動
   - **App name**: `Easy Data Crawler`
   - **App description**: 以下の説明文を入力
     ```
     Easy Data Crawler is a marketing automation tool that automatically retrieves X (Twitter) advertising campaign performance data and exports it to Google Spreadsheets for reporting and analysis purposes.
     ```
   - **Website URL**: あなたのウェブサイトURL（例: `https://forestdali.co.jp/`）
   - **Callback URI / Redirect URL**: 
     ```
     https://easy-data-crawler.vercel.app/api/platforms/x/callback
     ```
     ⚠️ **重要**: デプロイ後の本番URLを設定してください。後から変更するのは面倒です。
     - Vercelにデプロイする場合の例: `https://easy-data-crawler.vercel.app/api/platforms/x/callback`
     - カスタムドメインの場合: `https://app.easydatacrawler.com/api/platforms/x/callback`
     - 開発環境でテストする場合は、追加で以下も登録:
       ```
       http://localhost:3000/api/platforms/x/callback
       ```
   - **App permissions**: `Read and write` または `Read`（広告データ取得には `Read` でOK）

### 3. 認証情報を取得

1. **Keys and tokens** タブに移動
   - **API Key** をコピー → `X_API_KEY`
   - **API Secret** をコピー → `X_API_SECRET`
   - **Bearer Token** を生成してコピー → `X_BEARER_TOKEN`（オプション）

### 4. OAuth設定

1. **Settings → User authentication settings** に移動
   - **App permissions**: `Read and write` または `Read`
   - **Callback URI / Redirect URL** に追加:
     ```
     http://localhost:3000/api/platforms/x/callback
     ```
   - **Type of App**: `Web App, Automated App or Bot`

### 5. 必要な権限（スコープ）

- `tweet.read` - ツイートの読み取り
- `ads.read` - 広告データの読み取り
- `ads.write` - 広告データの書き込み（必要に応じて）
- `offline.access` - オフラインアクセス（リフレッシュトークン取得）

### 6. 審査について

- X Ads APIを使用するには、**X Ads APIへのアクセス申請**が必要な場合があります
- 申請は **X Ads API Portal** から行います
- 審査には数日〜数週間かかる場合があります

---

## 📊 Google Sheets

### 1. Google Cloud Console でプロジェクトを作成

1. **Google Cloud Console** にアクセス
   - https://console.cloud.google.com/

2. **新しいプロジェクトを作成**

3. **APIとサービス → ライブラリ** から以下を有効化:
   - Google Sheets API
   - Google Drive API

### 2. OAuth認証情報を作成

1. **APIとサービス → 認証情報** に移動

2. **「認証情報を作成」→「OAuth クライアント ID」**

3. **アプリケーションの種類**: `ウェブアプリケーション`

4. **承認済みのリダイレクト URI** に追加:
   ```
   https://easy-data-crawler.vercel.app/api/platforms/google-sheets/callback
   ```
   ⚠️ **重要**: デプロイ後の本番URLを設定してください。
   - Vercelにデプロイする場合: `https://easy-data-crawler.vercel.app/api/platforms/google-sheets/callback`
   - カスタムドメインの場合: `https://app.easydatacrawler.com/api/platforms/google-sheets/callback`
   - 開発環境でテストする場合は、追加で以下も登録:
     ```
     http://localhost:3000/api/platforms/google-sheets/callback
     ```

5. **クライアントID** と **クライアントシークレット** をコピー

---

## 🚀 本番環境での設定

本番環境にデプロイする場合は、以下を変更してください：

### Vercelにデプロイする場合

1. **Vercelにプロジェクトをデプロイ**
   - GitHubリポジトリをVercelに接続
   - デプロイ後、`https://your-project-name.vercel.app` のURLが発行されます

2. **リダイレクトURI** をVercelのURLに設定
   ```
   https://easy-data-crawler.vercel.app/api/platforms/{platform}/callback
   ```
   - `{platform}` は `meta`, `tiktok`, `x`, `google-sheets` など

3. **各プラットフォームの開発者コンソール** でVercelのURLを登録
   - すべてのプラットフォームで同じVercelドメインを使用

4. **環境変数** をVercelの環境変数設定に追加
   - Vercel Dashboard → Settings → Environment Variables

### カスタムドメインを使用する場合

1. **カスタムドメインを設定**
   - Vercel Dashboard → Settings → Domains

2. **リダイレクトURI** をカスタムドメインに変更
   ```
   https://app.easydatacrawler.com/api/platforms/{platform}/callback
   ```

3. **各プラットフォームの開発者コンソール** でカスタムドメインを登録

---

## ✅ 確認方法

各プラットフォームの認証情報を設定後、以下で確認できます：

1. **設定画面** (`/settings`) にアクセス
2. 各プラットフォームの「連携する」ボタンをクリック
3. OAuth認証が正常に完了すればOK

---

## 📝 注意事項

- **開発環境** では `http://localhost:3000` を使用
- **本番環境** では `https://yourdomain.com` を使用
- 各プラットフォームの**リダイレクトURI**は正確に設定してください
- **App Secret** や **API Secret** は絶対に公開しないでください

---

## ❓ よくある質問（FAQ）

### Q: 個人アカウントでもアプリを作成できますか？

**A:** はい、可能です。
- **Meta**: 個人のFacebookアカウントでもアプリ作成可能
- **TikTok**: TikTok For Businessアカウントが必要（個人でも作成可能）
- **X**: 個人のXアカウントでもアプリ作成可能

### Q: アプリの審査にはどのくらい時間がかかりますか？

**A:** プラットフォームによって異なります：
- **Meta**: 通常1-3営業日
- **TikTok**: 数日〜1週間程度
- **X**: 数日〜数週間（Ads APIへのアクセス申請が必要な場合）

### Q: 審査が通るまでテストできませんか？

**A:** 開発環境では審査前でもテストできる場合があります：
- **Meta**: 開発モードでテスト可能
- **TikTok**: 開発環境では制限付きでテスト可能
- **X**: 開発環境では制限付きでテスト可能

### Q: 複数のアカウントを連携できますか？

**A:** はい、可能です。
- 「他のアカウントを追加」ボタンから、別のアカウントでOAuth認証を行えば追加できます
- 各アカウントの広告アカウントがすべて取得されます

### Q: リダイレクトURIのエラーが出ます

**A:** 以下を確認してください：
1. リダイレクトURIが正確に入力されているか（末尾のスラッシュなど）
2. 開発環境と本番環境でURLが異なる場合は、両方登録する
3. プロトコル（http/https）が正しいか

### Q: 広告アカウントが取得できません

**A:** 以下を確認してください：
1. OAuth認証に使ったアカウントが広告アカウントへのアクセス権限を持っているか
2. 広告アカウントが実際に存在するか
3. アプリに必要な権限（スコープ）が付与されているか

---

## 🔧 トラブルシューティング

### エラー: "OAuth認証の開始に失敗しました"

**原因**: 環境変数が設定されていない、またはApp ID/Secretが間違っている

**解決方法**:
1. `.env`ファイルに正しい認証情報が設定されているか確認
2. アプリの設定画面でApp ID/Secretを再確認
3. サーバーを再起動

### エラー: "Invalid redirect URI"

**原因**: リダイレクトURIが登録されていない、または不一致

**解決方法**:
1. 各プラットフォームの開発者コンソールでリダイレクトURIを確認
2. 正確なURLを登録（プロトコル、ポート番号、パスを含む）
3. 開発環境と本番環境で異なる場合は、両方登録

### エラー: "Access token expired"

**原因**: アクセストークンの有効期限が切れた

**解決方法**:
1. 設定画面から再認証を行う
2. リフレッシュトークンが正しく設定されているか確認

### エラー: "Insufficient permissions"

**原因**: アプリに必要な権限（スコープ）が付与されていない

**解決方法**:
1. 各プラットフォームの開発者コンソールで権限を確認
2. 必要なスコープを追加
3. ユーザーに再認証を依頼

