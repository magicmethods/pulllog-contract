# PullLog Contract

個人のガチャ履歴を記録・管理する Web アプリ「PullLog」の API 設計ドキュメント（OpenAPI 3.0）を管理するリポジトリです。

---

## 目次

- [ディレクトリ構成](#ディレクトリ構成)
- [クイックスタート](#クイックスタート)
- [スキーマ駆動開発](#スキーマ駆動開発)
- [ライセンス](#ライセンス)
- [コントリビューション](#コントリビューション)
- [関連リンク](#関連リンク)

---

## ディレクトリ構成

```
contract/
├── api-schema.yaml          ← エントリーポイント（外部参照インデックス）
├── SCHEMA-INDEX.md          ← スキーマ・エンドポイント参照ガイド
├── schemas/                 ← コンポーネント定義
│   ├── auth.yaml            ← 認証・ユーザー関連スキーマ
│   ├── app.yaml             ← アプリ関連スキーマ
│   ├── log.yaml             ← ログ関連スキーマ
│   ├── gallery.yaml         ← ギャラリー関連スキーマ
│   ├── common.yaml          ← 共通スキーマ
│   └── security.yaml        ← セキュリティスキーム定義
├── paths/                   ← エンドポイント定義
│   ├── auth.yaml
│   ├── apps.yaml
│   ├── logs.yaml
│   ├── user.yaml
│   └── gallery.yaml
├── scripts/
│   ├── validate-schema.sh   ← 検証スクリプト（macOS / Linux）
│   └── validate-schema.bat  ← 検証スクリプト（Windows）
└── package.json             ← npm スクリプト（validate / bundle）
```

スキーマ・エンドポイントの詳細な一覧と参照ルールは [SCHEMA-INDEX.md](./SCHEMA-INDEX.md) を参照してください。

---

## クイックスタート

```bash
# 依存関係のインストール
npm install

# スキーマ検証
npm run validate

# 単一ファイルへバンドル（Swagger UI や配布用）
npm run bundle          # → api-schema.bundle.yaml
npm run bundle:json     # → api-schema.bundle.json

# 検証 → バンドル 一括実行
npm run validate:then:bundle
```

### Swagger UI で閲覧する

バンドル後に [Swagger Editor](https://editor.swagger.io/) を開き、`api-schema.bundle.yaml` をアップロードして確認できます。

---

## スキーマ駆動開発

バックエンド（Laravel）は `api-schema.yaml` からルーティング・リクエスト・レスポンス型を生成する「スキーマ駆動」開発を前提にしています。フロントエンド（Nuxt）は `api-schema.yaml` を参照し、型や呼び出しをスキーマに準拠させてください。

### Laravel へのコード生成例

```bash
# バンドル済みファイルを使用する
npx @openapitools/openapi-generator-cli generate \
  -i api-schema.bundle.yaml \
  -g php-laravel \
  -o ./generated
```

生成後の手順：

1. `generated/routes.php` → `routes/api.php` に差分マージ
2. `generated/Model/*.php` → `app/Models/*.php` に差分マージ・最適化
3. `generated/Http/Controllers/DefaultController.php` を適宜分離・最適化

### TypeScript クライアントの生成例

```bash
npx @openapitools/openapi-generator-cli generate \
  -i api-schema.bundle.yaml \
  -g typescript-fetch \
  -o ./generated/ts
```

---

## ライセンス

MAGIC METHODS に帰属します。

---

## コントリビューション

関係各位の Pull Request・Issue 歓迎です。  
設計や方針の議論は Discussions または Issue で行ってください。

---

## 関連リンク

- [PullLog フロントエンドリポジトリ](https://github.com/magicmethods/pulllog-frontend)
- [PullLog バックエンドリポジトリ](https://github.com/magicmethods/pulllog-backend)

