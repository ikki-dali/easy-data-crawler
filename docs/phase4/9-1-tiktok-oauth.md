# 9-1: TikTok Ads OAuth認証

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 9-1 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 4-7 |
| **ステータス** | ⬜ 未着手 |

## 説明

TikTok Marketing API へのアクセス用 OAuth 2.0 認証フローを実装する。

## タスク

- [ ] TikTok OAuth クライアント設定
- [ ] 認証開始エンドポイント (`/api/platforms/tiktok/authorize`)
- [ ] コールバックエンドポイント (`/api/platforms/tiktok/callback`)
- [ ] 認証状態確認API (`/api/platforms/tiktok/status`)
- [ ] トークン保存・暗号化

## 実装詳細

### 環境変数

```env
TIKTOK_APP_ID=your-app-id
TIKTOK_APP_SECRET=your-app-secret
TIKTOK_REDIRECT_URI=http://localhost:3000/api/platforms/tiktok/callback
```

### TikTok OAuth フロー

1. 認証URL: `https://business-api.tiktok.com/portal/auth`
2. トークンURL: `https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/`
3. スコープ: `ad_read`, `ad_operation`

### ファイル構成

```
src/
├── lib/
│   └── tiktok/
│       └── client.ts          # OAuth クライアント
├── app/api/platforms/tiktok/
│   ├── authorize/route.ts     # 認証開始
│   ├── callback/route.ts      # コールバック
│   └── status/route.ts        # ステータス確認
```

## 完了条件

- [ ] TikTok OAuth 認証が開始できる
- [ ] 認証後にトークンが暗号化保存される
- [ ] 認証状態を確認できる

## 参考リソース

- [TikTok Marketing API](https://business-api.tiktok.com/portal/docs)
- [TikTok OAuth](https://business-api.tiktok.com/portal/docs?id=1738373164380162)

