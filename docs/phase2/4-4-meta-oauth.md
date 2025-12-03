# 4-4: Meta (Facebook) OAuth認証

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 4-4 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 3-5 |
| **ステータス** | ⬜ 未着手 |

## 説明

Meta Marketing API へのアクセス用 OAuth 2.0 認証フローを実装する。

## タスク

- [ ] Meta OAuth クライアント設定
- [ ] 必要なスコープ設定
- [ ] 認証開始エンドポイント
- [ ] コールバックエンドポイント
- [ ] 認証状態確認API

## 実装詳細

### 必要なスコープ

```
ads_management
ads_read
business_management
```

### 環境変数

```env
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
META_REDIRECT_URI=http://localhost:3000/api/platforms/meta/callback
```

### APIエンドポイント

- `GET /api/platforms/meta/authorize` - 認証開始
- `GET /api/platforms/meta/callback` - コールバック
- `GET /api/platforms/meta/status` - 認証状態確認
- `DELETE /api/platforms/meta/status` - 連携解除

## 完了条件

- [ ] Meta OAuth 認証が開始できる
- [ ] 認証後にトークンが保存される
- [ ] 認証状態を確認できる

## 参考リソース

- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis/)
- [Meta OAuth](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)

