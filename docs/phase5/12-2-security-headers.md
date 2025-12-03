# 12-2: セキュリティヘッダー・CSP

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 12-2 |
| **複雑度** | Medium |
| **見積もり** | 3時間 |
| **依存** | 12-1 |
| **ステータス** | ⬜ 未着手 |

## 説明

セキュリティヘッダーと Content Security Policy を設定する。

## タスク

- [ ] Next.js セキュリティヘッダー設定
- [ ] CSP ポリシー定義
- [ ] CSRF 対策確認
- [ ] XSS 対策確認

## 実装詳細

### next.config.mjs

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 完了条件

- [ ] セキュリティヘッダーが設定される
- [ ] CSP が適切に設定される
- [ ] セキュリティスキャンでA評価

