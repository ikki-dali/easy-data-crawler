# 9-5: LINE Ads 認証・データ取得

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 9-5 |
| **複雑度** | Medium |
| **見積もり** | 5時間 |
| **依存** | 4-7 |
| **ステータス** | ⬜ 未着手 |

## 説明

LINE Ads API へのアクセス用認証フローとデータ取得機能を実装する。

## タスク

- [ ] LINE OAuth クライアント設定
- [ ] 認証開始エンドポイント
- [ ] コールバックエンドポイント
- [ ] 認証状態確認API
- [ ] アカウント一覧取得
- [ ] レポートデータ取得

## 実装詳細

### 環境変数

```env
LINE_CLIENT_ID=your-client-id
LINE_CLIENT_SECRET=your-client-secret
LINE_REDIRECT_URI=http://localhost:3000/api/platforms/line/callback
```

### LINE Ads API

```typescript
// ベースURL
const LINE_ADS_API_URL = 'https://ads.line.me/api/v3';

// エンドポイント
GET /accounts                    // アカウント一覧
GET /reports/adAccounts          // アカウントレポート
GET /reports/campaigns           // キャンペーンレポート
GET /reports/adGroups            // 広告グループレポート
```

### 取得可能なメトリクス

- `cost` - 費用
- `impressions` - インプレッション
- `clicks` - クリック数
- `reach` - リーチ
- `frequency` - フリークエンシー
- `ctr` - CTR
- `cpc` - CPC
- `cpm` - CPM
- `conversions` - コンバージョン

### ファイル構成

```
src/
├── lib/
│   └── line/
│       └── client.ts          # OAuth クライアント
├── lib/platforms/
│   └── line-ads.ts            # データ取得
├── app/api/platforms/line/
│   ├── authorize/route.ts
│   ├── callback/route.ts
│   ├── status/route.ts
│   └── accounts/route.ts
```

## 完了条件

- [ ] LINE OAuth 認証が動作する
- [ ] LINE 広告アカウント一覧を取得できる
- [ ] レポートデータを取得できる
- [ ] Worker でジョブ処理できる

## 参考リソース

- [LINE Ads API](https://developers.line.biz/ja/docs/line-ads/)

