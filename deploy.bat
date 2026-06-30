@echo off
chcp 65001 > nul
echo ==============================================
echo [逐語録] デプロイスクリプト (CSVコンパイル + Gitプッシュ)
echo ==============================================

rem 1. CSVからJSへのコンパイルを実行
echo [1/3] CSVデータをJS形式に変換しています...
python convert_csv_to_js.py
if %ERRORLEVEL% neq 0 (
    echo [ERROR] CSVの変換に失敗しました。
    pause
    exit /b %ERRORLEVEL%
)

rem 2. Git へのステージングとコミット
echo [2/3] 変更を追加・コミットしています...
set /p commit_msg="コミットメッセージを入力してください (改行せずにキー入力、空欄なら自動設定): "
if "%commit_msg%"=="" (
    set commit_msg="Update game contents and layout"
)

git add -A
git commit -m "%commit_msg%"

rem 3. GitHubへのプッシュ
echo [3/3] GitHub (origin main) へプッシュしています...
git push origin main
if %ERRORLEVEL% neq 0 (
    echo [ERROR] GitHubへのプッシュに失敗しました。
    pause
    exit /b %ERRORLEVEL%
)

echo ==============================================
echo [SUCCESS] 変換 ＆ プッシュが完了しました！
echo ==============================================
pause
