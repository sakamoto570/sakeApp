# Sake Recommend App

日本酒の検索、類似銘柄の推薦、お気に入り、飲酒記録を提供するWebアプリです。

## Workspace

- `apps/frontend`: Vue 3 SPA
- `apps/backend`: Fastify on AWS Lambda
- `apps/batch`: さけのわAPI同期バッチ
- `infra`: AWS CDK
- `packages/shared`: DTO、ドメイン型、APIレスポンス型
- `packages/utils`: 共通ユーティリティ

## Commands

依存関係のインストール後、ルートから各ワークスペースのスクリプトを実行します。

```bash
npm install
npm run dev
npm run build
npm run test
```

