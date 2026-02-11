FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG ENV_DEV
RUN echo "$ENV_DEV" > .env
RUN mkdir -p public
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# [권장] standalone 모드를 사용하면 node_modules 전체를 복사할 필요가 없어 가볍습니다.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
# standalone 모드 실행 시 node server.js를 사용합니다.
CMD ["node", "server.js"]
