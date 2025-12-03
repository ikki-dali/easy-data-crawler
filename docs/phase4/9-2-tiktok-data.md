# 9-2: TikTok Ads データ取得

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 9-2 |
| **複雑度** | Medium |
| **見積もり** | 4時間 |
| **依存** | 9-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

TikTok Marketing API を使用して広告レポートデータを取得する機能を実装する。

## タスク

- [ ] TikTok アカウント一覧取得API
- [ ] レポートデータ取得関数
- [ ] データ変換・整形処理
- [ ] Worker への統合

## 実装詳細

### TikTok Reporting API

```typescript
// エンドポイント
const TIKTOK_API_URL = 'https://business-api.tiktok.com/open_api/v1.3';

// レポートエンドポイント
GET /report/integrated/get/
POST /report/integrated/get/
```

### 取得可能なメトリクス

- `spend` - 費用
- `impressions` - インプレッション
- `clicks` - クリック数
- `reach` - リーチ
- `ctr` - CTR
- `cpc` - CPC
- `cpm` - CPM
- `conversion` - コンバージョン

### ファイル構成

```
src/lib/platforms/
└── tiktok-ads.ts    # データ取得関数
```

## 完了条件

- [ ] TikTok 広告アカウント一覧を取得できる
- [ ] レポートデータを取得できる
- [ ] Worker でジョブ処理できる

## 参考リソース

- [TikTok Reporting API](https://business-api.tiktok.com/portal/docs?id=1738864915188737)

