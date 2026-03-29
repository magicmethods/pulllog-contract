@echo off
REM OpenAPI スキーマ検証スクリプト (Windows版)
setlocal enabledelayedexpansion

pushd %~dp0..
set CONTRACT_DIR=%CD%
popd
set SCHEMA_DIR=%CONTRACT_DIR%\schemas
set PATHS_DIR=%CONTRACT_DIR%\paths

echo.
echo ^^ PullLog API スキーマ検証を開始します...
echo.

REM ファイル存在確認
echo ^^ ファイル構成の確認...
set "files[0]=%CONTRACT_DIR%\api-schema.yaml"
set "files[1]=%SCHEMA_DIR%\security.yaml"
set "files[2]=%SCHEMA_DIR%\auth.yaml"
set "files[3]=%SCHEMA_DIR%\app.yaml"
set "files[4]=%SCHEMA_DIR%\log.yaml"
set "files[5]=%SCHEMA_DIR%\gallery.yaml"
set "files[6]=%SCHEMA_DIR%\common.yaml"
set "files[7]=%PATHS_DIR%\auth.yaml"
set "files[8]=%PATHS_DIR%\apps.yaml"
set "files[9]=%PATHS_DIR%\logs.yaml"
set "files[10]=%PATHS_DIR%\user.yaml"
set "files[11]=%PATHS_DIR%\gallery.yaml"

for /l %%i in (0,1,11) do (
  if exist "!files[%%i]!" (
    echo   ^" !files[%%i]!
  ) else (
    echo   X 欠落: !files[%%i]!
    exit /b 1
  )
)

echo.
echo ^^ ファイル存在確認OK
echo.

echo ^^ 外部参照統計...
findstr /R /C:"\$ref.*\.yaml" "%CONTRACT_DIR%\api-schema.yaml" > nul
if errorlevel 0 echo   外部参照を確認しました。
echo.

REM npm run validate が利用可能な場合
if exist "%CONTRACT_DIR%\package.json" (
  echo ^^ npm run validate...
  pushd "%CONTRACT_DIR%"
  npm run validate
  popd
  echo.
)

echo.
echo ^^ スキーマ検証完了！
echo.
echo 次のステップ:
echo   1. バンドル: cd %CONTRACT_DIR% ^&^& npm run bundle
echo   2. Swagger UI で表示: https://editor.swagger.io/ にバンドルファイルを貼り付け
echo   3. フロントエンドで利用: contract/api-schema.yaml を参照
echo.
