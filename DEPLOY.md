# GitHub Pages 公開手順

すでにローカルでの準備（Gitへの登録とコミット）は完了しています。以下の手順でインターネット上に公開できます。

## ステップ 1: GitHubで新しいリポジトリを作成する
1. ブラウザで [GitHub](https://github.com/) にアクセスし、ログインします（アカウントが無い場合は作成してください）。
2. 右上の「**+**」ボタン ➔ 「**New repository**」をクリックします。
3. 以下を設定します：
   - **Repository name**: `tikugo_rock`
   - **Public / Private**: 必ず「**Public**」（公開）を選択してください（無料プランでGitHub Pagesを使うため）。
   - 他の項目（READMEの追加など）はすべてチェックを外したままにします。
4. 下部にある「**Create repository**」ボタンを押します。

## ステップ 2: ローカルリポジトリをGitHubに送信する
1. 作成後の画面に表示されるコマンドのうち、**「…or push an existing repository from the command line」** の下にあるコードをコピーします。
2. 通常、以下のような2行のコマンドです（`ユーザー名`の部分はご自身のアカウント名になります）。

   ```bash
   git remote add origin https://github.com/ユーザー名/tikugo_rock.git
   git push -u origin main
   ```

3. PowerShellやコマンドプロンプトで、現在のフォルダ（`C:\antigravity_tool\tikugo_rock`）を開いた状態で、上記のコマンドを貼り付けて実行します。
   * ※初回実行時、GitHubへのログイン認証画面（ブラウザ）が表示されるので、認証を許可してください。

## ステップ 3: GitHub Pagesの設定をする
1. GitHub上のリポジトリページを開きます。
2. 上部メニューの「⚙️ **Settings**」をクリックします。
3. 左サイドバーにある「**Pages**」をクリックします。
4. **Build and deployment** の設定を行います：
   - **Source**: `Deploy from a branch`
   - **Branch**: `None` になっている部分を「**main**」に変更し、右側のフォルダ指定は「`/ (root)`」のまま「**Save**」ボタンを押します。

## ステップ 4: 公開の確認
1. 保存後、約1〜2分待ってからページをリロードします。
2. 「**Pages**」設定画面の上部に、以下のような公開URLが表示されます：
   `https://ユーザー名.github.io/tikugo_rock/`
3. このURLにスマートフォン等からアクセスすれば、どこからでも無料でゲームをプレイできます！
