# PullLog Contract

PullLog の **API 契約正本** を管理する OpenAPI 3.0 リポジトリです。  
`contract/api-schema.yaml` を中心に、`frontend/` と `backend/stable/` の最新実装との差分を継続監査し、**contract-first + agent-assisted review** で整合性を維持します。

> **重要:** 今後の契約同期・監査対象は `backend/stable/` のみです。`backend/beta/` は完全に対象外です。

---

## 目次

- [このリポジトリの役割](#このリポジトリの役割)
- [クイックスタート](#クイックスタート)
- [ディレクトリ構成](#ディレクトリ構成)
- [API 契約監査ワークフロー](#api-契約監査ワークフロー)
- [カスタムエージェント一覧](#カスタムエージェント一覧)
- [日常運用の基本フロー](#日常運用の基本フロー)
- [CI 連携方針](#ci-連携方針)
- [補足: 旧スキーマ駆動フローについて](#補足-旧スキーマ駆動フローについて)
- [関連ドキュメント](#関連ドキュメント)
- [ライセンス](#ライセンス)

---

## このリポジトリの役割

この `contract/` ワークスペースは、以下を担います。

- **OpenAPI 正本の維持**
  - `api-schema.yaml`
  - `paths/*.yaml`
  - `schemas/*.yaml`
- **実装との差分監査**
  - `frontend/` の API 利用状況
  - `backend/stable/` の実装ルート・コントローラ
- **安全な仕様反映**
  - 決定論的チェック
  - エージェントレビュー
  - human approval

---

## クイックスタート

```bash
# 依存関係のインストール
npm install

# OpenAPI 構文・参照整合性の検証
npm run validate

# バンドル生成（配布・Swagger Editor 確認用）
npm run bundle
npm run bundle:json

# frontend + backend/stable を横断した drift 検出
npm run drift:all
```

### よく使うコマンド

| コマンド | 用途 |
| --- | --- |
| `npm run validate` | OpenAPI スキーマの整合性検証 |
| `npm run validate:verbose` | 詳細ログ付き検証 |
| `npm run bundle` | YAML バンドル生成 |
| `npm run bundle:json` | JSON バンドル生成 |
| `npm run drift:frontend` | `frontend/` 観測 API と契約の差分検出 |
| `npm run drift:backend` | `backend/stable/` 観測 API と契約の差分検出 |
| `npm run drift:all` | 横断差分検出 |
| `npm run drift:ci` | CI 用。未反映差分があれば非 0 終了 |

### Swagger UI で確認する

`npm run bundle` 実行後、[Swagger Editor](https://editor.swagger.io/) で `api-schema.bundle.yaml` を開いて確認できます。

---

## ディレクトリ構成

```text
contract/
├── api-schema.yaml                     # OpenAPI エントリーポイント（正本）
├── SCHEMA-INDEX.md                     # 参照ルールとインデックス
├── paths/                              # エンドポイント定義
├── schemas/                            # 再利用スキーマ定義
├── scripts/
│   ├── detect-api-drift.mjs            # 実装差分の決定論的チェック
│   ├── validate-schema.sh
│   └── validate-schema.bat
├── docs/
│   └── api-contract-sync-workflow.md   # 監査フロー詳細
└── .github/
    ├── agents/                         # API 契約監査用カスタムエージェント
    └── instructions/                   # contract 編集時の補助指示
```

スキーマ・エンドポイントの参照ルールは `SCHEMA-INDEX.md` を確認してください。

---

## API 契約監査ワークフロー

現在の標準運用は、**「実装をそのまま仕様化する」のではなく、差分を監査して承認済み変更だけを仕様へ反映する** 方式です。

### 基本方針

1. **`contract/api-schema.yaml` が正本**
2. `frontend/` と `backend/stable/` を継続監査
3. 差分はまず **レポート化**
4. **human approval** 後にのみ契約更新
5. 更新後は `npm run validate` で必ず検証

### この実装で追加したもの

- 4 つのカスタムエージェント
- `scripts/detect-api-drift.mjs` による決定論的差分抽出
- VS Code task から実行できる drift check
- `contract` 編集時に参照される補助 instructions

### 監査で検出する主な差分

- **missing-in-contract**: 実装にあるが契約に未反映
- **stale-in-contract**: 契約に残っているが実装側に根拠が薄い
- **schema-mismatch**: path は一致するが request / response の形が怪しい
- **human-decision-required**: 実装の暫定挙動や意図確認が必要

---

## カスタムエージェント一覧

| エージェント | 役割 | 主な対象 |
| --- | --- | --- |
| `contract-audit-orchestrator` | 監査フロー全体の親オーケストレーション | drift check + auditor 呼び出し + reviewer 統合 |
| `frontend-contract-auditor` | フロントエンドの API 利用を監査 | `../frontend/api/endpoints.ts`, `../frontend/server/api/**` |
| `backend-contract-auditor` | stable Laravel バックエンド実装を監査 | `../backend/stable/routes/**`, `../backend/stable/app/Http/Controllers/**` |
| `contract-gap-reviewer` | 2 つの監査結果を統合し change plan を作成 | 契約差分全体 |
| `contract-spec-updater` | 承認済み plan を `contract/` に反映 | `api-schema.yaml`, `paths/**`, `schemas/**` |

### 代表的な使い方

- 「`frontend-contract-auditor` でフロント実装と契約のズレを洗い出す」
- 「`backend-contract-auditor` で stable API 実装との差分を確認する」
- 「`contract-gap-reviewer` で change plan をまとめる」
- 「承認済み plan に基づき `contract-spec-updater` で仕様を更新する」

---

## 日常運用の基本フロー

### 1. まず差分を検出する

VS Code のターミナル、または Task から以下を実行します。

```bash
npm run drift:all
```

または VS Code Task:

- `OpenAPI: Detect drift (frontend)`
- `OpenAPI: Detect drift (backend stable)`
- `OpenAPI: Detect drift (all)`

> **重要:** `npm run drift:all` は **`scripts/detect-api-drift.mjs` による決定論的チェックだけ** を実行します。  
> このコマンド自体は `frontend-contract-auditor` / `backend-contract-auditor` / `contract-gap-reviewer` を自動起動しません。

### 2. VS Code Chat でエージェントレビューを行う

差分レポートを見ながら、VS Code Chat で必要なエージェントを呼びます。

#### まず一括で回したいとき

最も簡単なのは、VS Code Chat で prompt **`Run API contract audit`** を選ぶか、
`contract-audit-orchestrator` にまとめて依頼する方法です。

**おすすめプロンプト例:**

```text
contract-audit-orchestrator を使って、PullLog の API 契約監査フローを一括実行してください。
frontend と backend/stable を対象に drift check を行い、必要なら auditor を使ってレビューし、
最後に human approval 用の change plan までまとめてください。beta は無視してください。
```

#### 横断レビューをしたいとき

**おすすめプロンプト例:**

```text
contract-gap-reviewer を使って、最新の contract と frontend / backend/stable 実装差分をレビューし、
missing-in-contract / schema-mismatch / human-decision-required に整理してください。
beta 系統は無視してください。
```

#### フロントエンド側だけ深掘りしたいとき

```text
frontend-contract-auditor で frontend/api/endpoints.ts と server/api を中心に、
contract/api-schema.yaml との差分を監査してください。
未定義 endpoint と request/response の疑義を evidence 付きで出してください。
```

#### stable バックエンド側だけ深掘りしたいとき

```text
backend-contract-auditor で backend/stable/routes/api.php と Controllers を確認し、
contract/api-schema.yaml に未反映の endpoint や仕様ズレを evidence 付きで整理してください。
```

### 3. 人手で採否を決める

レビュー結果を見て、以下を判断します。

- 正式採用する API 変更か
- 一時実装や未公開挙動ではないか
- schema 化して問題ないか
- 既存 schema を修正すべきか、新規 schema を追加すべきか

### 4. 承認済み change plan に基づいて契約を更新する

更新対象は通常、以下です。

- `paths/*.yaml`
- `schemas/*.yaml`
- `api-schema.yaml`

**おすすめプロンプト例:**

```text
contract-spec-updater を使って、承認済み change plan に従い contract を最小差分で更新してください。
更新後は npm run validate を実行し、結果も報告してください。
```

### 5. 最後に検証する

```bash
npm run validate
npm run bundle
```

必要に応じて `npm run drift:all` を再実行し、差分が妥当な状態になっていることを確認します。

---

## CI 連携方針

### 最低限の推奨

- `contract/` 変更時 → `npm run validate`
- `frontend/` / `backend/stable/` 変更時 → `npm run drift:ci`

### さらに有効な運用

- PR テンプレートに **API 影響あり / なし** を追加
- drift 結果の JSON を artifact 保存
- `contract-gap-reviewer` の最終 change plan を PR に添付

---

## 補足: 旧スキーマ駆動フローについて

以前は OpenAPI からコード生成する **スキーマ駆動開発** を主軸に検討していましたが、現在の主運用はそれではありません。

現在は以下を優先します。

- **contract-first** で仕様を保守する
- 実装との差分は **監査フロー** で検知する
- 更新は **承認済み change plan** に限定する

そのため、コード生成は必要時の参考手段に留め、README では主運用としては扱いません。

---

## 関連ドキュメント

- `SCHEMA-INDEX.md` — スキーマ参照ルールと一覧
- `docs/api-contract-sync-workflow.md` — 監査フロー詳細
- `../frontend/api/endpoints.ts` — フロントエンド側の API 定義入口
- `../backend/stable/routes/api.php` — stable バックエンドの主要 API ルート

---

## ライセンス

MAGIC METHODS に帰属します。

---

## コントリビューション

Pull Request / Issue 歓迎です。  
API 仕様変更を伴う場合は、できるだけ以下を含めてください。

- 変更の背景
- 影響 endpoint
- contract 変更有無
- `npm run validate` または `npm run drift:all` の結果

---

## 関連リンク

- [PullLog フロントエンドリポジトリ](https://github.com/magicmethods/pulllog-frontend)
- [PullLog バックエンドリポジトリ](https://github.com/magicmethods/pulllog-backend)

