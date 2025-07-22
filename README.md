# PullLog Contract
個人のガチャ履歴を記録・管理するWebアプリ「PullLog」の各種設計ドキュメント管理リポジトリです。  

---

## 目次

- [API設計](#API設計)
- [スキーマ駆動について](#スキーマ駆動について)
- [ライセンス](#ライセンス)
- [コントリビューション](#コントリビューション)
- [関連リンク](#関連リンク)

---

## API設計

OpenAPI 3.0形式のAPI設計書は [api-schema.yaml](./api-schema.yaml) を参照してください。  

※ https://editor.swagger.io/ から「File」→「Import URL」で、GitHubのrawファイルURLを指定することでSwaggerUIで閲覧可能です。

---

## スキーマ駆動について

バックエンドのAPIサーバは、OpenAPIの api-schema.yaml からAPI仕様を取り込んでレスポンスの型やルーティングコードを自動生成する「スキーマ駆動」開発を実施すること。これにより設計されたスキーマとAPIサーバの動作が完全一致します。  
フロントエンドのNuxtアプリについては現状「スキーマ駆動」は難しいので、都度最新のAPIスキーマを参照して処理をスキーマに準拠させてください。

**Laravelへの実装例:**  

```
openapi-generator-cli generate -i https://raw.githubusercontent.com/magicmethods/pulllog-contract/refs/heads/main/api-schema.yaml?token=GHSAT0AAAAAADFV3JAVZHEORW3LBY5Y45T62D7LK6A -g php-laravel -o ./generated
```

1. エンドポイントの追加や変更は `generated/routes.php` を `routes/api.php` へ差分のみマージする
2. リクエストやレスポンスの変更は `generated/Model/*.php` を `app/Models/*.php` へ差分マージ・最適化する
3. コントローラ `generated/Http/Controllers/DefaultController.php` は適宜分離・最適化する

---

## ライセンス

MAGIC METHODS に帰属します。

---

## コントリビューション

関係各位のPull Request・Issue歓迎です。
設計や方針の議論はDiscussionsまたはIssueで行ってください。

---

## 関連リンク

- [PullLog フロントエンドリポジトリ](https://github.com/magicmethods/pulllog-frontend)
- [PullLog バックエンドリポジトリ](https://github.com/magicmethods/pulllog-backend)
- ドキュメント

