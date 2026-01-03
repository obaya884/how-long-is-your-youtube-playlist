# How Long Is Your YouTube Playlist?

YouTube プレイリストの合計再生時間を計算して表示する Chrome 拡張機能です。

## 特徴

- **合計時間の自動計算**: プレイリスト内の読み込まれている全ての動画の再生時間を合計し、ヘッダー部分に表示します。
- **Load All ボタン**: 巨大なプレイリストにおいて、1クリックで全ての動画を読み込み、正確な合計時間を算出できます。

## インストール方法（開発者モード）

1. このリポジトリをクローンまたはダウンロードします。
2. 依存関係をインストールします。
   ```bash
   npm install
   ```
3. プロジェクトをビルドします。
   ```bash
   npm run build
   ```
4. ブラウザ（Chrome/Edge）で `chrome://extensions` を開きます。
5. 右上の「デベロッパー モード」をオンにします。
6. 「パッケージ化されていない拡張機能を読み込む」をクリックし、プロジェクト内の `dist` フォルダを選択します。

## 開発用コマンド

- `npm run build`: プロジェクトをビルドし、`dist` ディレクトリに出力します。
- `npm run dev`: 開発モードで起動します（ファイルの変更を監視して自動ビルドします）。
- `npm run clean`: `dist` ディレクトリを削除します。

## プロジェクト構成

```
.
├── src/                # ソースコード (TypeScript)
│   └── content/        # コンテンツスクリプト
│       ├── index.ts    # エントリーポイント（Observer, 初期化）
│       ├── ui.ts       # UI UIの生成・更新ロジック
│       ├── duration.ts # 時間の計算ロジック
│       ├── config.ts   # 設定定数
│       └── utils.ts    # ユーティリティ関数
├── _locales/           # 翻訳ファイル (i18n)
├── icons/              # 拡張機能アイコン
├── styles.css          # UI スタイル
├── manifest.json       # 拡張機能の設定ファイル
├── webpack.config.js   # Webpack 設定
└── tsconfig.json       # TypeScript 設定
```

## 技術スタック

- **Language**: TypeScript
- **Bundler**: Webpack
- **Logic**: Vanilla JavaScript (DOM Manipulation)
- **Styling**: CSS

## ライセンス

MIT License
