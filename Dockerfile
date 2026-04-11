# ベースイメージ: Node.js 22 LTS（安定版）
FROM node:22-slim

# コンテナ内の作業ディレクトリを設定
WORKDIR /usr/src/app

# 依存関係ファイルをコピーしてインストール
# package.jsonより先にコピーすることでDockerのキャッシュを活用できる
COPY package*.json ./
RUN npm install

# アプリのソースコードをコピー
COPY . .

# Next.jsのデフォルトポートを公開
EXPOSE 3000

# 開発サーバーを起動
CMD ["npm", "run", "dev"]
