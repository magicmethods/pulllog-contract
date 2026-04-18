# API 概要

この文書は、contract subproject 内で管理する PullLog API の人間向け正本概要です。  
機械可読な正本は引き続き `../api-schema.yaml` です。

## この文書の対象

- 公開可能な範囲での主要 API リソース群の整理
- 認証モデルの要約
- OpenAPI の生ファイルを直接読まない読者向けの高水準ルートマップ

## 契約正本

- 機械可読な正本: `../api-schema.yaml`
- エンドポイント定義: `../paths/*.yaml`
- 共通スキーマ: `../schemas/*.yaml`

## バージョンと環境

- 本番のベースパスは `/api/v1`
- ローカル開発環境では stable と beta で到達先や実行条件が異なる場合があります
- 破壊的変更は新しいバージョンパスで導入します

正確な server 定義や変数は `../api-schema.yaml` を参照してください。

## 認証モデル

PullLog API は多層の認証モデルを採用しています。

1. サービス間 API キー
   - 公式 frontend のサーバー側プロキシで管理します
   - 公開ブラウザクライアントへ埋め込んではいけません
2. ユーザー単位の CSRF またはセッション結合トークン
   - 契約で定義される認証付き書き込みや保護対象の読み取りに必要です

エンドポイントごとの厳密な security 要件は `../paths/*.yaml` の operation 定義を参照してください。

## 主要リソースマップ

| 領域 | 代表パス | 目的 |
| --- | --- | --- |
| Auth | `/auth/*` | ログイン、登録、検証、パスワード再設定、CSRF 更新、OAuth 連携 |
| Apps | `/apps`, `/apps/{appId}` | アプリ管理 |
| Logs | `/logs/{appId}`, `/logs/daily/{appId}/{date}`, `/logs/import/{appId}` | 日次ログの CRUD とインポート |
| Stats | `/stats/{appId}` | 集計統計 |
| User | `/user`, `/user/update`, `/user/avatar`, `/user-filters/{context}` | プロフィールとユーザー固有設定 |
| Gallery | `/gallery/assets/*`, `/gallery/usage` | 画像資産のアップロード、一覧、詳細、更新、削除、使用量 |
| Utility | `/currencies` | 共通マスターデータ |

## 代表ルート

| Method | Path | 用途 |
| --- | --- | --- |
| POST | `/auth/login` | メールアドレスとパスワードでログイン |
| POST | `/auth/autologin` | Cookie を利用した自動ログイン |
| POST | `/auth/register` | アカウント作成 |
| POST | `/auth/csrf/refresh` | CSRF トークン更新 |
| GET | `/apps` | アプリ一覧取得 |
| GET | `/logs/{appId}` | 指定アプリのログ一覧取得 |
| GET | `/stats/{appId}` | 集計統計取得 |
| GET | `/user` | 現在ユーザーのプロフィール取得 |
| POST | `/gallery/assets/upload-ticket` | アップロードチケット発行 |
| GET | `/gallery/assets` | ギャラリー資産一覧取得 |
| GET | `/gallery/usage` | ギャラリー使用量取得 |

この表は代表例のみです。完全な契約は `../api-schema.yaml` を正本とします。

## データ形式とエラーの扱い

- 契約で multipart を明示する場合を除き、基本の request と response は JSON です
- バリデーション、認証、競合は標準的な HTTP ステータスコードで表現します
- 正確なレスポンス本文、フィールド名、制約は契約スキーマを参照してください

## 関連資料

- `../README.md`
- `../api-schema.yaml`
- `./api-contract-sync-workflow.md`