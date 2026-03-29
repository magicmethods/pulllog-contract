# PullLog API スキーマインデックス

このドキュメントは、分割された OpenAPI 3.0 スキーマの構成と参照ガイドです。

## 📁 ディレクトリ構成

```
contract/
├── api-schema.yaml          ← メインスキーマ（インデックス・エントリーポイント）
├── SCHEMA-INDEX.md          ← このファイル
├── schemas/                 ← スキーマ定義（モデル）
│   ├── auth.yaml            ← 認証・ユーザー関連スキーマ
│   ├── app.yaml             ← アプリ関連スキーマ
│   ├── log.yaml             ← ログ関連スキーマ
│   ├── gallery.yaml         ← ギャラリー関連スキーマ
│   ├── common.yaml          ← 共通スキーマ
│   └── security.yaml        ← セキュリティスキーム定義
├── paths/                   ← エンドポイント定義
│   ├── auth.yaml            ← 認証エンドポイント
│   ├── apps.yaml            ← アプリ管理エンドポイント
│   ├── logs.yaml            ← ログ・統計エンドポイント
│   ├── user.yaml            ← ユーザー関連エンドポイント
│   └── gallery.yaml         ← ギャラリーエンドポイント
└── scripts/                 ← 検証・ユーティリティスクリプト
    ├── validate-schema.sh   ← シェル検証スクリプト
    └── validate-schema.bat  ← Windows 検証スクリプト
```

## 🔍 スキーマ参照ガイド

### 参照ルール

現在の分割スキーマは、各 `schemas/*.yaml` を最小の OpenAPI 文書として保持し、その中の `components.schemas` を参照します。

- メインインデックス `api-schema.yaml` からの参照例:

```yaml
AppData:
	$ref: './schemas/app.yaml#/components/schemas/AppData'
```

- `paths/*.yaml` からの参照例:

```yaml
schema:
	$ref: '../schemas/common.yaml#/components/schemas/DeleteResponse'
```

- `schemas/*.yaml` 内の自己参照例:

```yaml
items:
	$ref: '#/components/schemas/SymbolOption'
```

参照を追加・変更する場合は、必ず `#/components/schemas/<SchemaName>` 形式を使ってください。

- セキュリティスキームの参照例（`api-schema.yaml` のみ）:

```yaml
CsrfAuth:
  $ref: './schemas/security.yaml#/components/securitySchemes/CsrfAuth'
```

### 認証・ユーザー (`schemas/auth.yaml`)

| スキーマ | 説明 |
|---------|------|
| `LoginRequest` | ログインリクエスト（email, password, remember） |
| `LoginResponse` | ログインレスポンス（state, message, user, tokens） |
| `RegisterRequest` | 登録リクエスト（name, email, password, language） |
| `RegisterResponse` | 登録レスポンス（state, message） |
| `UserResponse` | ユーザー情報レスポンス（id, name, email, roles等） |
| `UserPlanLimits` | プラン上限値 |
| `PasswordResetRequest` | パスワード再設定リクエスト（email） |
| `PasswordResetResponse` | パスワード再設定レスポンス |
| `PasswordUpdateRequest` | パスワード更新リクエスト（token, type, code, password） |
| `VerifyTokenRequest` | メール認証トークンリクエスト（token, type） |
| `VerifyResponse` | 認証レスポンス（success, message） |
| `UserUpdateRequest` | プロフィール更新リクエスト |
| `UserUpdateRequestFormData` | プロフィール更新フォームデータ |
| `UserUpdateResponse` | プロフィール更新レスポンス |

### アプリ (`schemas/app.yaml`)

| スキーマ | 説明 |
|---------|------|
| `AppData` | アプリデータ（name, appId, url, description, settings等） |
| `SymbolOption` | レアリティ・マーカー・タスク定義 |

### ログ (`schemas/log.yaml`)

| スキーマ | 説明 |
|---------|------|
| `DateLog` | 日次ログデータ（appId, date, pulls, items, expenses等） |
| `DropDetail` | 排出詳細（rarity, name, marker） |
| `ImportLogsResponse` | インポート結果レスポンス |

### ギャラリー (`schemas/gallery.yaml`)

| スキーマ | 説明 |
|---------|------|
| `GalleryAsset` | ギャラリー資産 |
| `GalleryAssetUploadRequest` | アップロードリクエスト |
| `GalleryAssetUpdateRequest` | メタデータ更新リクエスト |
| `GalleryAssetListResponse` | 資産一覧レスポンス |
| `GalleryUsageResponse` | ストレージ使用量レスポンス |
| `PaginationLinks` | ページネーション情報 |
| `PaginationMeta` | ページネーションメタデータ |

### 共通 (`schemas/common.yaml`)

| スキーマ | 説明 |
|---------|------|
| `DeleteResponse` | 削除結果レスポンス（state, message） |
| `StatsData` | 統計データ |

## 🛣️ エンドポイント参照ガイド

### 認証 (`paths/auth.yaml`)

| エンドポイント | メソッド | 説明 |
|-------------|---------|------|
| `/auth/login` | POST | ユーザーログイン |
| `/auth/logout` | POST | ユーザーログアウト |
| `/auth/register` | POST | アカウント新規登録 |
| `/auth/password` | POST/PUT | パスワード再設定リクエスト・確定 |
| `/auth/verify` | POST | メール認証トークン受付 |
| `/auth/autologin` | POST | 自動ログイン（Remember Me） |

### アプリ管理 (`paths/apps.yaml`)

| エンドポイント | メソッド | 説明 |
|-------------|---------|------|
| `/apps` | GET | ユーザーのアプリ一覧取得 |
| `/apps` | POST | アプリ新規登録 |
| `/apps/{appId}` | GET | 単一アプリデータ取得 |
| `/apps/{appId}` | PUT | アプリデータ更新 |
| `/apps/{appId}` | DELETE | アプリ削除 |

### ログ・統計 (`paths/logs.yaml`)

| エンドポイント | メソッド | 説明 |
|-------------|---------|------|
| `/logs/{appId}` | GET | 日次ログ一覧取得 |
| `/logs/daily/{appId}/{date}` | GET | 指定日の日次ログ取得 |
| `/logs/daily/{appId}/{date}` | POST | 日次ログ新規登録 |
| `/logs/daily/{appId}/{date}` | PUT | 日次ログ更新 |
| `/logs/daily/{appId}/{date}` | DELETE | 日次ログ削除 |
| `/logs/import/{appId}` | POST | ログバルクインポート |
| `/stats/{appId}` | GET | 統計データ取得 |

### ユーザー (`paths/user.yaml`)

| エンドポイント | メソッド | 説明 |
|-------------|---------|------|
| `/user/update` | PUT | プロフィール更新 |

### ギャラリー (`paths/gallery.yaml`)

| エンドポイント | メソッド | 説明 |
|-------------|---------|------|
| `/gallery/assets` | GET | ギャラリー資産一覧取得 |
| `/gallery/assets` | POST | 資産アップロード |
| `/gallery/assets/{assetId}` | GET | 資産詳細取得 |
| `/gallery/assets/{assetId}` | PATCH | メタデータ更新 |
| `/gallery/assets/{assetId}` | DELETE | 資産削除 |
| `/gallery/usage` | GET | ストレージ使用量取得 |

## 🔐 セキュリティ

すべての認証済みエンドポイント（`/apps`, `/logs/*`, `/user/*`, `/gallery/*`）は以下のセキュリティスキームを使用します：

- **CsrfAuth** - `x-csrf-token` ヘッダ（`schemas/security.yaml` で定義）

## 📖 使用方法

### Swagger UI での表示

```bash
# Swagger Editor で開く場合（外部参照対応環境を使用）
# https://editor.swagger.io/?url=https://raw.githubusercontent.com/...contract/api-schema.yaml

# ローカルではまずバンドル済みファイルを生成
npm run bundle
```

### 開発時のスキーマ検証

```bash
# contract ディレクトリで依存関係をインストール
npm install

# スキーマ検証
npm run validate

# YAML / JSON バンドル生成
npm run bundle
npm run bundle:json

# 一括実行
npm run validate:then:bundle
```

### コード生成

モジュラー構造になったため、以下のツールでコード生成が容易になりました：

- **OpenAPI Generator**: `npx @openapitools/openapi-generator-cli`
- **orval**: TypeScript クライアント自動生成
- **swagger-codegen**: 複数言語対応

## 📝 スキーマ更新時のポイント

1. **エンドポイント追加**: 適切な `paths/*.yaml` に追加
2. **スキーマ追加**: 適切な `schemas/*.yaml` に追加
3. **新参照の記載**: `api-schema.yaml` の `components.schemas` に外部参照を追加
4. **参照形式の統一**: `paths/*.yaml` と `api-schema.yaml` では `../schemas/*.yaml#/components/schemas/*` または `./schemas/*.yaml#/components/schemas/*` を使う
5. **自己参照の統一**: `schemas/*.yaml` 内では `#/components/schemas/*` を使う
6. **バンドル検証**: 配布前に `npm run validate:then:bundle` を実行する

## 📊 メトリクス

| 項目 | 値 |
|------|-----|
| メインスキーマファイルサイズ縮減 | 92% (1986行 → 125行) |
| スキーマファイル数 | 5 |
| パスファイル数 | 5 |
| 総エンドポイント数 | 20+ |
| 総スキーマ数 | 27 |

## 🚀 将来の活用

このモジュラー構造により以下が容易になります：

- ✅ **バリデーション統合**: スキーマからの自動バリデーション生成
- ✅ **型安定性**: TypeScript/Go等での型の自動生成
- ✅ **ドキュメント管理**: 機能単位でのマークダウン統合
- ✅ **CI/CD統合**: 自動バンドル・検証パイプライン
- ✅ **バージョン管理**: 機能単位での変更追跡
