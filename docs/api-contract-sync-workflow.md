# API Contract Sync Workflow

`contract/api-schema.yaml` を正本として保ちながら、`frontend/` と `backend/stable/` の実装差分を継続的に監査するためのワークフローです。  
**`backend/beta/` は対象外** とし、今後の契約同期からは完全に除外します。

---

## 目的

- フロントエンド実装・安定版バックエンド実装・OpenAPI 契約のズレを早期検知する
- 新実装を API 仕様へ安全に取り込む
- 自動化しつつも **human approval** を必須にして、誤った仕様化を防ぐ

---

## 構成要素

### カスタムエージェント

| ファイル | 役割 |
| --- | --- |
| `.github/agents/contract-orch-audit.agent.md` | `contract-orch-audit`。drift check → 監査 → 統合レビューの起点 |
| `.github/agents/contract-audit-frontend.agent.md` | `contract-audit-frontend`。`frontend/` の API 利用実装を監査 |
| `.github/agents/contract-audit-backend.agent.md` | `contract-audit-backend`。`backend/stable/` の API 実装を監査 |
| `.github/agents/contract-review-gap.agent.md` | `contract-review-gap`。上記 2 つの監査結果を統合し、変更計画を作成 |
| `.github/agents/contract-impl-spec.agent.md` | `contract-impl-spec`。承認済み change plan に基づいて `contract/` を更新 |

### 補助スクリプト

| コマンド | 役割 |
| --- | --- |
| `npm run drift:frontend` | フロントエンド観測 API と contract の差分を検出 |
| `npm run drift:backend` | `backend/stable/` 観測 API と contract の差分を検出 |
| `npm run drift:all` | フロント + stable バックエンドを横断して差分を検出 |
| `npm run drift:ci` | CI 向け。contract 未反映差分があれば非 0 終了 |

---

## 推奨フロー

1. **決定論的チェック**
   - `npm run drift:all`
   - 未反映候補や stale 候補を一覧化
   - この段階では **エージェントは起動しない**

2. **エージェントレビュー**
   - VS Code Chat で `contract-orch-audit` または prompt の `Start Contract Audit Workflow` を起点にする
   - 必要に応じて orchestrator が `contract-audit-frontend` / `contract-audit-backend` を併用する
   - 差分を `missing-in-contract` / `schema-mismatch` / `human-decision-required` に整理

3. **人手承認**
   - 取り込む変更を確定
   - 一時実装や誤検知をここで除外

4. **契約更新**
   - `contract-impl-spec` が `paths/*.yaml`, `schemas/*.yaml`, `api-schema.yaml` を最小差分で更新

5. **検証**
   - `npm run validate`
   - 必要に応じて `npm run bundle` / `npm run bundle:json`

### 現在の自動化境界

現時点では、**`npm run drift:all` だけで auditor エージェント 2 つが並列起動し、その後 reviewer が自動実行される構成にはしていません**。

現在の実装は次の分離です。

- `npm run drift:all` = **決定論的な差分抽出のみ**
- `contract-audit-frontend` / `contract-audit-backend` = **Chat 上の監査レビュー**
- `contract-review-gap` = **差分統合と change plan 作成**

`contract-orch-audit` を入口にし、通常は specialist agent を直接選ばず、必要な場合だけ orchestrator から委譲します。

---

## CI 組み込み方針

### 最低限

- `contract/` 変更時: `npm run validate`
- `frontend/` または `backend/stable/` 変更時: `npm run drift:ci`

### 推奨

- PR テンプレートに `API 影響あり / なし` を追加
- `drift:all --format json` の結果を artifact として保存
- reviewer エージェントの最終 change plan を PR コメントに添付

---

## 運用ルール

- **contract-first を原則** とする
- エージェントは差分検出・レビュー支援・更新補助として使う
- 実装からの自動反映をそのまま正としない
- `backend/beta/` は今後の監査対象から除外する

---

## VS Code での使い方

### 代表的な依頼例

- prompt の `Start Contract Audit Workflow` から開始する
- `contract-orch-audit` に「contract 監査フローを一括実行して」と依頼する
- 必要時のみ `contract-audit-frontend` / `contract-audit-backend` / `contract-review-gap` / `contract-impl-spec` を個別利用する

### 判断基準

- **自動反映しない**: 実装があるだけでは正式仕様とはみなさない
- **証拠を残す**: ルート定義、コントローラ、`frontend/api/endpoints.ts` などを根拠にする
- **最小差分で更新**: `paths/**`, `schemas/**`, `api-schema.yaml` を必要最小限だけ修正する

---

## 今後の拡張候補

- レスポンス shape の簡易推定を `backend/stable/app/Http/Controllers/**` まで広げる
- `frontend/server/api/**` の実装から query / header 使用も抽出する
- CI で JSON レポートを蓄積し、差分の推移を可視化する
- 承認済み change plan を JSON 化して updater の入力精度を上げる
