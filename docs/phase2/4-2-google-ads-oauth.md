# 4-2: Google Ads OAuth認証

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 4-2 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 3-5 |
| **ステータス** | ⬜ 未着手 |

## 説明

Google Ads API へのアクセス用 OAuth 2.0 認証フローを実装する。

## タスク

- [ ] Google Ads OAuth クライアント設定
- [ ] 必要なスコープ設定
- [ ] 認証開始エンドポイント
- [ ] コールバックエンドポイント
- [ ] 認証状態確認API

## 実装詳細

### 必要なスコープ

```
https://www.googleapis.com/auth/adwords
```

### 環境変数

```env
GOOGLE_ADS_CLIENT_ID=your-client-id
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_REDIRECT_URI=http://localhost:3000/api/platforms/google-ads/callback
```

### APIエンドポイント

- `GET /api/platforms/google-ads/authorize` - 認証開始
- `GET /api/platforms/google-ads/callback` - コールバック
- `GET /api/platforms/google-ads/status` - 認証状態確認
- `DELETE /api/platforms/google-ads/status` - 連携解除

## 完了条件

- [ ] Google Ads OAuth 認証が開始できる
- [ ] 認証後にトークンが保存される
- [ ] 認証状態を確認できる

## 参考リソース

- [Google Ads API OAuth](https://developers.google.com/google-ads/api/docs/oauth/overview)

