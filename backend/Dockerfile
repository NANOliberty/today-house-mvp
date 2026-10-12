# Debian 기반: Prisma 엔진이 요구하는 OpenSSL 이 기본 포함 (alpine 은 libssl1.1 누락으로 실패)
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "run", "dev"]
