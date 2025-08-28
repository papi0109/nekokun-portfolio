# nekokun-portfolio

GitHub Pages で公開するソフトウェアデベロッパー向けポートフォリオです。Docker Compose を使い、ローカルでは Google Apps Script(GAS) を模した API（モック）からデータを取得して動作確認できます。

## 概要
- ルート直下の `index.html` を GitHub Pages で配信
- ハッシュベースの SPA ナビゲーション
- ポートフォリオのデータは GAS のエンドポイント（本番）またはローカルモックから `fetch` で取得
- ローカル開発は 2 コンテナ構成
  - `github-pages`: 静的サイト配信（nginx, `http://localhost:8000`）
  - `gas`: GAS モック API（Express, `http://localhost:8888`）

## ディレクトリ構成
- `index.html`: エントリーポイント（`assets/` から CSS/JS を読み込む）
- `assets/`
  - `css/main.css`: スタイル一式
  - `js/main.js`: ルーター、API取得、描画
  - `images/`: 画像（`favicon.png`, `typing_man.png`, ほか）
  - `config.js`: ランタイム設定（CI で本番用 URL を書き込み）
- `gas/`（ローカルのモックAPI + 本番GASスクリプトの両方を含む）
  - `local-server.js`: Express モックAPI（/api/portfolio, /admin UI など）
  - `admin/`
    - `login.html`: 管理画面ログイン
    - `index.html`: フォームベースの管理画面（Profile/Skills/Career/Works/Hobbies）
  - `src/`（実運用の Google Apps Script）
    - `api.gs`: スプレッドシート連携の `doGet`/`doPost`
    - `appsscript.json`: マニフェスト
  - `data/`: モックAPI用CSV（起動時に作成され、`.gitignore` 済み）
    - `about.csv`, `links.csv`, `skills_*.csv`, `careers.csv`, `hobbies.csv`, `works.csv`
  - `Dockerfile`: モックAPI用（nodemon ホットリロード）
  - `package.json`, `nodemon.json`
  - `.clasp.json`, `.claspignore`, `.env.example`
  - `tools/sync-clasp-from-env.mjs`: `.env` の `SCRIPT_ID` を `.clasp.json` に反映
- `nginx/default.conf`: ローカルの静的配信設定（キャッシュ無効）
- `Dockerfile.pages`: 静的サイト用コンテナ（nginx）
- `compose.yaml`: 2 サービス（github-pages / gas）の定義
- `.github/workflows/pages.yml`: GitHub Pages デプロイ（`assets/config.js` を生成）

## 前提条件
- Docker / Docker Compose v2
- （任意）Node.js >= 18（Docker を使わず GAS モックを起動したい場合）

## ローカル開発（Docker Compose）
1) ビルド
```
docker compose build
```

2) 起動
```
docker compose up
```

3) 動作確認
- サイト: http://localhost:8000
- API（モック）: http://localhost:8888/api/portfolio

フロント側（`assets/js/main.js`）は、`localhost` で動作している場合に `API_BASE=http://localhost:8888` を自動的に使用します。初回ページロード時に `GET /api/portfolio` を取得し、各セクションを描画します。

### モック API（gas/local-server.js）
- 許可メソッド: GET のみ（それ以外は 405）
- エンドポイント:
  - `/api/portfolio`: `profile`, `skills`, `projects` を含む JSON を返却
  - `/api/health`: `{ ok: true }`
- ポートフォリオ内容は `gas/local-server.js` のデータを書き換えてください。

## 本番（GitHub Pages）
GitHub Pages は実行時の環境変数を直接使えないため、GitHub Actions でデプロイ時に `assets/config.js` を生成して API の URL を埋め込みます（リポジトリ変数 `vars` を使用）。

### 1) リポジトリ変数の設定
GitHub リポジトリ設定:
- Settings → Secrets and variables → Actions → Variables
- `API_BASE_URL` を追加（GAS Web App の公開 URL）
  - 例: `https://script.google.com/macros/s/XXXXXXXX/exec`

### 2) Pages の設定
- Settings → Pages
- Source: `Branch: main`, `Folder: /(root)`

### 3) デプロイ
本リポジトリには `.github/workflows/pages.yml` を同梱しています。内容は以下:
- リポジトリを checkout
- `assets/config.js` を生成（`window.__APP_CONFIG__.API_BASE = ${{ vars.API_BASE_URL }}`）
- アーティファクトをアップロードし、Pages へデプロイ

`main` ブランチへ push 後、数分で公開されます。フロントは `assets/config.js` を読み込み、そこで定義された `API_BASE` を使って GAS からデータを取得します。

## 実運用の Google Apps Script
本番で GAS を使う際の流れ（スプレッドシート連携）:

### 1) スクリプトを用意
- このリポジトリの `gas/src/api.gs` は、スプレッドシートをデータソースとして `doGet`/`doPost` を提供します。
- `clasp` を使う場合（任意）:
  - `cd gas`
  - `.clasp.json` の `scriptId` を設定（既存プロジェクトがない場合は `npx clasp create --type standalone` で作成）
  - `npm run clasp:login && npm run clasp:push && npm run deploy`

### 2) スクリプトプロパティ（環境変数）を設定
- GAS エディタ → プロジェクトのプロパティ → スクリプトのプロパティ
- 必須/推奨:
  - `ADMIN_PASSWORD`: 保存API用パスワード（例: `test-api-password`）
  - `SPREADSHEET_ID`: 既存スプレッドシートを使う場合に設定。未設定なら初回呼び出しで自動作成されます。

### 3) スプレッドシートの構成
自動作成されますが、既存を使う場合は以下のシート名・ヘッダ行を用意してください（1行目はヘッダ）。
- `about`: `text`
- `links`: `title, href`
- `skills_languages`: `value`
- `skills_frameworks`: `value`
- `skills_tools`: `value`
- `skills_clouds`: `value`
- `careers`: `period, title, industry, description, languages, tools`
  - `description / languages / tools` は「;（セミコロン）」区切りで複数値を保存
- `hobbies`: `title, code, desc, image`
- `works`: `title, desc, href, image`

### 4) Web アプリとしてデプロイ
- GAS エディタ → デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
- 実行するユーザー: 自分
- アクセスできるユーザー: 全員（匿名ユーザーを含む）
- デプロイURLを控える

### 5) GitHub Pages への反映
- リポジトリの `Settings → Secrets and variables → Actions → Variables` に `API_BASE_URL` を追加
  - 値: Web アプリのデプロイURL（例: `https://script.google.com/macros/s/XXXXXXXX/exec`）
- `main` へ push すると、Actions が `assets/config.js` に `API_BASE` を埋め込み、Pages に公開します。

### 管理画面（GAS / スプレッドシート編集UI）
- アクセス方法: Web アプリのURLに `?admin=1` を付けて開きます。
  - 例: `https://script.google.com/macros/s/XXXXXXXX/exec?admin=1`
- 認証: 右上の Password に、スクリプトプロパティ `ADMIN_PASSWORD` に設定した値を入力して操作します。
- できること:
  - Profile: About Text と Links（自己紹介ページの箇条書き）
  - Skills: 言語/フレームワーク/ツール/クラウド（1行1項目）
  - Career / Works / Hobbies: 追加・削除・編集に対応
- 保存: Save All で全シートを上書き保存（即座に API の GET 応答に反映）
- 備考: GAS 側管理画面は HtmlService により配信されます。`ADMIN_PASSWORD` が未設定の場合は保存できません。

### 管理画面（ローカルモック / 参考）
- URL: `http://localhost:8888/admin`
- 認証: デフォルトパスワードは `test-api-password`（環境変数 `ADMIN_PASSWORD` で変更可）
- 保存先: `gas/data/*.csv`（.gitignore 済み）。保存後はモックAPIの GET 応答に即反映され、Pages ローカル配信（http://localhost:8000）にも反映されます。

### API 仕様（GAS）
- `GET {WEB_APP_URL}`: シート内容を JSON で返却
  - 返却例の主なキー: `about.text`, `links[]`, `skills.{languages,frameworks,tools,clouds}`, `careers[]`, `hobbies[]`, `works[]`
- `POST {WEB_APP_URL}`: JSON を受け取りシートへ保存（全件上書き）
  - ボディ: `{ "password": "<ADMIN_PASSWORD>", "data": { ...同スキーマ... } }`
  - レスポンス: `{ ok: true, data: { ...保存後の内容... } }`
  - 例:
    ```bash
    curl -X POST \
      -H "Content-Type: application/json" \
      -d '{"password":"test-api-password","data":{"about":{"text":"Hello"}}}' \
      https://script.google.com/macros/s/XXXXXXXX/exec
    ```

補足:
- `gas/` には `clasp` の設定が入っています。必要に応じて `npm run clasp:*` を利用してください。
- 本リポジトリのローカル管理画面（http://localhost:8888/admin）は Express モック用です。GAS 側の編集はスプレッドシートで直接行うか、`POST` の保存APIを呼んでください。

## コマンドリファレンス
- ローカル起動（Docker）
  - `docker compose build && docker compose up`
- API ヘルスチェック（ローカル）
  - `curl http://localhost:8888/api/health`
- Docker を使わずに GAS モック起動（任意）
  - `cd gas && npm i && npm start`（デフォルト 8888 番ポート）

## トラブルシューティング
- ビルド時に `/gas/local-server.js not found`
  - `compose.yaml` のビルドコンテキストが `./gas` のため、`gas/Dockerfile` は `COPY package.json .` / `COPY local-server.js .` を使用する必要があります（本リポジトリは修正済み）。
- 本番で CORS エラーになる
  - GAS 側の公開設定・ヘッダを確認してください。一般公開の GET JSON であれば通常は問題ありません。
- Pages で古い API URL が使われる
  - `vars.API_BASE_URL` が設定されているか、Actions のログで `assets/config.js` の生成を確認してください。

## ライセンス
未指定（必要に応じて追加してください）。
