# AlpineベースのNodeイメージを指定
FROM node:20-alpine

# Gitをインストール
RUN apk add --no-cache git

# 作業ディレクトリの設定
WORKDIR /app

# コンテナのデフォルトコマンド（docker-composeで上書きされますが一応）
CMD ["sh"]