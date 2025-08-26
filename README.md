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
- `assets/css/main.css`: スタイル
- `assets/js/main.js`: ルーターとデータ取得・描画
- `assets/config.js`: ランタイム設定（CI で本番用 URL を書き込み）
- `assets/images/`: 画像置き場（プレースホルダあり）
- `gas/`: ローカルの GAS モック API
  - `local-server.js`: GET のみ許可する Express サーバ
  - `.clasp.json`, `.claspignore`: 実際の GAS 用の設定
  - `Dockerfile`: GAS コンテナ用
- `Dockerfile.pages`: 静的サイト用コンテナ（nginx）
- `compose.yaml`: 2 サービスの定義

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
本番で GAS を使う際の流れ:
1) GAS プロジェクトで Web アプリをデプロイ（GET 許可）。
   例:
   ```js
   function doGet(e) {
     var data = { /* profile/skills/projects など */ };
     return ContentService
       .createTextOutput(JSON.stringify(data))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```
2) 公開 URL をリポジトリ変数 `API_BASE_URL` に設定。
3) `main` へ push して再デプロイ。

補足: `gas/` には `clasp` の設定が入っています。実際の GAS 管理が必要な場合は `gas` ディレクトリで `npm run clasp:*` を利用してください。

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
