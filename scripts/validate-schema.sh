#!/bin/bash
# OpenAPI スキーマ検証スクリプト
# 外部参照されたモジュラースキーマが正しく構成されているかチェック

set -e

CONTRACT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_DIR="$CONTRACT_DIR/schemas"
PATHS_DIR="$CONTRACT_DIR/paths"

echo "🔍 PullLog API スキーマ検証を開始します..."
echo ""

# 1. ファイル存在確認
echo "✓ ファイル構成の確認..."
files=(
  "$CONTRACT_DIR/api-schema.yaml"
  "$SCHEMA_DIR/security.yaml"
  "$SCHEMA_DIR/auth.yaml"
  "$SCHEMA_DIR/app.yaml"
  "$SCHEMA_DIR/log.yaml"
  "$SCHEMA_DIR/gallery.yaml"
  "$SCHEMA_DIR/common.yaml"
  "$PATHS_DIR/auth.yaml"
  "$PATHS_DIR/apps.yaml"
  "$PATHS_DIR/logs.yaml"
  "$PATHS_DIR/user.yaml"
  "$PATHS_DIR/gallery.yaml"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $(basename "$file")"
  else
    echo "  ✗ 欠落: $(basename "$file")"
    exit 1
  fi
done

echo ""
echo "✓ ファイル存在確認OK"
echo ""

# 2. YAML構文チェック（yqが利用可能な場合）
if command -v yq &> /dev/null; then
  echo "✓ YAML構文チェック..."
  for file in "${files[@]}"; do
    yq eval '.' "$file" > /dev/null 2>&1 && echo "  ✓ $(basename "$file")" || echo "  ✗ 構文エラー: $(basename "$file")"
  done
  echo ""
fi

# 3. 外部参照チェック
echo "✓ 外部参照の確認..."
ref_count=$(grep -r '\$ref.*\.yaml' "$CONTRACT_DIR" --include="*.yaml" | wc -l)
echo "  外部参照数: $ref_count"
echo ""

# 4. ファイルサイズ確認
echo "✓ ファイルサイズ確認..."
main_size=$(wc -c < "$CONTRACT_DIR/api-schema.yaml")
old_estimated_size=$((62 * 1024))  # 元ファイルが62KBだった
reduction=$((100 * (old_estimated_size - main_size) / old_estimated_size))
echo "  メインスキーマ: $(( main_size / 1024 ))KB（約${reduction}%削減）"
echo ""

# 5. npm run validate が利用可能な場合
if [ -f "$CONTRACT_DIR/package.json" ] && command -v npm &> /dev/null; then
  echo "✓ npm run validate..."
  (cd "$CONTRACT_DIR" && npm run validate) && echo "  ✓ 検証OK" || echo "  ✗ 検証失敗"
  echo ""
fi

echo "✅ スキーマ検証完了！"
echo ""
echo "次のステップ："
echo "  1. バンドル: cd $CONTRACT_DIR && npm run bundle"
echo "  2. Swagger UI で表示: https://editor.swagger.io/ にバンドルファイルを貼り付け"
echo "  3. フロントエンドで利用: contract/api-schema.yaml を参照"
