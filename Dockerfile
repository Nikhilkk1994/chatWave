# syntax=docker/dockerfile:1
# Pure JS deps — no native compile. Rebuilds faster with npm cache mount.

FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund \
    && node -e "require('express'); console.log('deps ok')"

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
