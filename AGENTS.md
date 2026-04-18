# Repository Guidelines

本ドキュメントは `contract/`（OpenAPI 契約管理）向けの作業ガイドです。
API スキーマの正本はこのディレクトリの `api-schema.yaml` です。

## Terminology Policy
- PullLog 全体は `workspace`、`contract/` など各トップレベルディレクトリは `subproject` と呼ぶ。
- 正式な定義は `../pulllog-docs/docs/workspace-terminology.md` を参照する。
- VS Code 機能の説明では `workspace` / `workspace folder`、pnpm の説明では `pnpm workspace` など公式用語を優先する。

## Project Structure
- `api-schema.yaml`: エントリーポイント（paths/schemas への外部参照インデックス）
- `paths/`: エンドポイント定義
- `schemas/`: コンポーネント定義（`security.yaml` を含む）
- `SCHEMA-INDEX.md`: 参照先一覧と命名ルール
- `scripts/`: 検証補助スクリプト

## Build, Validate, and Bundle Commands
- 依存関係インストール: `npm install`
- 検証: `npm run validate`
- 詳細検証: `npm run validate:verbose`
- バンドル（YAML）: `npm run bundle`
- バンドル（JSON）: `npm run bundle:json`
- 一括実行: `npm run validate:then:bundle`

## Coding & Editing Rules
- OpenAPI 3.0.3 の記法に準拠する。
- 参照ルールは `SCHEMA-INDEX.md` を正本として扱う。
- 新規エンドポイントは `paths/*.yaml` に定義し、`api-schema.yaml` から `$ref` で接続する。
- 新規スキーマは `schemas/*.yaml` に定義し、`components.schemas` 配下へ公開する。
- 変更は最小差分で行い、無関係な整形変更を避ける。

## Validation Policy
- 変更後は必ず `npm run validate` を実行する。
- 配布物が必要な場合のみ `npm run bundle` / `npm run bundle:json` を実行する。

## Repository Playwright E2E Reference
- フロントエンド E2E アーキテクチャの正本は `../frontend/docs/architecture/e2e-test.md`、マニフェスト定義の正本は `../frontend/e2e/cases/case.schema.json`。
- 規定プロジェクトマトリクスは `chromium` / `ipad-pro-11` / `iphone-14`。明示指定が必要な場合は frontend ワークスペースの既存スクリプトで `--project=chromium,ipad-pro-11,iphone-14` のようなカンマ区切り指定を優先する。
- レポートテンプレートは `../frontend/e2e/templates/`、リポジトリ既定セットは `../frontend/e2e/templates/pulllog/`。グローバル切替は `../frontend/.env.e2e` の `PLAYWRIGHT_E2E_TEMPLATE_DIR` 等で管理する。
- contract 変更で E2E へ影響する場合は、複数プロジェクト実行時の集約 Markdown レポートと PDF comparison table を前提に frontend 側の再検証対象を整理すること。

## Agent-Specific Notes
- 本 AGENTS.md は `contract/` 配下に適用。

## Workspace Root Policy Summary
- 上位階層（`pulllog/AGENTS.md`）の共通方針に合わせ、Windows では PowerShell を優先する。
- Python は存在を前提にしない。未確認状態で Python スクリプトを生成・実行しない。
- 実行コマンドは以下を優先する: `package.json` の既存スクリプト → リポジトリ内既存スクリプト → PowerShell → Node.js。
- contract では npm スクリプト（validate / bundle）を最優先で利用する。
- 検証は最小単位から行い、不要なフル処理や無関係な変更を避ける。
