# 9-4: X (Twitter) Ads データ取得

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 9-4 |
| **複雑度** | Medium |
| **見積もり** | 4時間 |
| **依存** | 9-3 |
| **ステータス** | ⬜ 未着手 |

## 説明

X Ads API を使用して広告レポートデータを取得する機能を実装する。

## タスク

- [ ] X アカウント一覧取得API
- [ ] レポートデータ取得関数
- [ ] データ変換・整形処理
- [ ] Worker への統合

## 実装詳細

### X Ads API

```typescript
// ベースURL
const X_ADS_API_URL = 'https://ads-api.twitter.com/12';

// エンドポイント
GET /accounts                    // アカウント一覧
GET /stats/accounts/:account_id  // 統計データ
GET /stats/campaigns             // キャンペーン統計
```

### 取得可能なメトリクス

- `billed_charge_local_micro` - 費用
- `impressions` - インプレッション
- `clicks` - クリック数
- `engagements` - エンゲージメント
- `follows` - フォロー
- `retweets` - リツイート
- `replies` - リプライ
- `likes` - いいね

### ファイル構成

```
src/lib/platforms/
└── x-ads.ts    # データ取得関数
```

## 完了条件

- [ ] X 広告アカウント一覧を取得できる
- [ ] レポートデータを取得できる
- [ ] Worker でジョブ処理できる

## 参考リソース

- [X Ads API Analytics](https://developer.twitter.com/en/docs/twitter-ads-api/analytics/overview)

