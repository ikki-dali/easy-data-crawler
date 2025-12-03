# 9-3: X (Twitter) Ads OAuth認証

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 9-3 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 4-7 |
| **ステータス** | ⬜ 未着手 |

## 説明

X (Twitter) Ads API へのアクセス用 OAuth 1.0a 認証フローを実装する。

## タスク

- [ ] X OAuth クライアント設定
- [ ] 認証開始エンドポイント
- [ ] コールバックエンドポイント
- [ ] 認証状態確認API
- [ ] トークン保存・暗号化

## 実装詳細

### 環境変数

```env
X_API_KEY=your-api-key
X_API_SECRET=your-api-secret
X_ACCESS_TOKEN=your-access-token
X_ACCESS_TOKEN_SECRET=your-access-token-secret
X_REDIRECT_URI=http://localhost:3000/api/platforms/x/callback
```

### X OAuth フロー (OAuth 1.0a)

1. Request Token URL: `https://api.twitter.com/oauth/request_token`
2. Authorize URL: `https://api.twitter.com/oauth/authorize`
3. Access Token URL: `https://api.twitter.com/oauth/access_token`

### ファイル構成

```
src/
├── lib/
│   └── x/
│       └── client.ts          # OAuth クライアント
├── app/api/platforms/x/
│   ├── authorize/route.ts     # 認証開始
│   ├── callback/route.ts      # コールバック
│   └── status/route.ts        # ステータス確認
```

## 完了条件

- [ ] X OAuth 認証が開始できる
- [ ] 認証後にトークンが暗号化保存される
- [ ] 認証状態を確認できる

## 参考リソース

- [X Ads API](https://developer.twitter.com/en/docs/twitter-ads-api)
- [X OAuth](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)

