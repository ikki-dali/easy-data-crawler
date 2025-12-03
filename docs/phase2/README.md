# Phase 2: コア機能開発

**期間**: Week 5-12  
**チケット数**: 28

## 概要

クローラー作成フロー（6ステップ）の実装、広告プラットフォームAPI連携、スプレッドシート連携を行う。

## Week 5-6: クローラー一覧・Step 0-1

| ID | チケット | 複雑度 | ステータス |
|----|----------|--------|-----------|
| [3-1](./3-1-crawler-list-api.md) | クローラー一覧API | Simple | ✅ |
| [3-2](./3-2-crawler-list-ui.md) | クローラー一覧画面 | Medium | ✅ |
| [3-3](./3-3-crawler-form-skeleton.md) | クローラー作成フォーム骨格 | Medium | ✅ |
| [3-4](./3-4-step0-name.md) | Step 0: クローラー名入力 | Simple | ✅ |
| [3-5](./3-5-google-oauth.md) | Google OAuth認証フロー | Medium | ✅ |
| [3-6](./3-6-step1-spreadsheet.md) | Step 1: スプレッドシートURL入力 | Medium | ✅ |
| [3-7](./3-7-step1-sheet-select.md) | Step 1: シート選択 | Simple | ✅ |

## Week 7-8: Step 2-3・プラットフォーム認証

| ID | チケット | 複雑度 | ステータス |
|----|----------|--------|-----------|
| [4-1](./4-1-step2-platform.md) | Step 2: プラットフォーム選択UI | Simple | ✅ |
| [4-2](./4-2-google-ads-oauth.md) | Google Ads OAuth認証 | Medium | ✅ |
| [4-3](./4-3-google-ads-accounts.md) | Google Ads アカウント一覧 | Simple | ✅ |
| [4-4](./4-4-meta-oauth.md) | Meta OAuth認証 | Medium | ✅ |
| [4-5](./4-5-meta-accounts.md) | Meta アカウント一覧 | Simple | ✅ |
| [4-6](./4-6-step3-accounts.md) | Step 3: 広告アカウント選択UI | Medium | ✅ |
| [4-7](./4-7-encrypt-credentials.md) | 認証情報暗号化保存 | Medium | ✅ |

## Week 9-10: Step 4・レポート設定

| ID | チケット | 複雑度 | ステータス |
|----|----------|--------|-----------|
| [5-1](./5-1-report-config-types.md) | レポート設定型定義 | Simple | ✅ |
| [5-2](./5-2-date-range-ui.md) | 期間設定UI | Medium | ✅ |
| [5-3](./5-3-dimensions-ui.md) | ディメンション選択UI | Medium | ✅ |
| [5-4](./5-4-metrics-ui.md) | メトリクス選択UI | Medium | ✅ |
| [5-5](./5-5-custom-conversions.md) | カスタムコンバージョン追加 | Simple | ✅ |
| [5-6](./5-6-custom-events.md) | カスタムイベント追加 | Simple | ✅ |
| [5-7](./5-7-exclude-zero-cost.md) | 費用0除外オプション | Simple | ✅ |

## Week 11-12: Step 5-6・保存

| ID | チケット | 複雑度 | ステータス |
|----|----------|--------|-----------|
| [6-1](./6-1-step5-schedule.md) | Step 5: スケジュール設定UI | Medium | ✅ |
| [6-2](./6-2-step6-tags.md) | Step 6: タグ設定UI | Simple | ✅ |
| [6-3](./6-3-crawler-create-api.md) | クローラー作成API | Medium | ✅ |
| [6-4](./6-4-test-execution.md) | テスト実行API | Medium | ✅ |
| [6-5](./6-5-test-result-ui.md) | テスト実行結果表示 | Simple | ✅ |
| [6-6](./6-6-save-redirect.md) | 保存完了・一覧遷移 | Simple | ✅ |

## 依存関係図

```
3-1 ──→ 3-2 ──→ 3-3 ──→ 3-4
                  │
                  └──→ 3-5 ──→ 3-6 ──→ 3-7
                         │
                         └──→ 4-2 ──→ 4-3
                         └──→ 4-4 ──→ 4-5
                                │
                                └──→ 4-6 ──→ 4-7
                                       │
5-1 ──→ 5-2 ──→ 5-3 ──→ 5-4 ──→ 5-5 ──→ 5-6 ──→ 5-7
                                              │
                                              └──→ 6-1 ──→ 6-2 ──→ 6-3 ──→ 6-4 ──→ 6-5 ──→ 6-6
```

## 完了条件

- [x] クローラー一覧が表示される
- [x] 6ステップのクローラー作成フォームが動作する
- [x] Google OAuth認証が機能する
- [x] 広告アカウントを選択できる
- [x] レポート設定を構成できる
- [x] スケジュールを設定できる
- [x] クローラーを保存できる
- [x] テスト実行が動作する

