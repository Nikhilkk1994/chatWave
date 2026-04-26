# Pure JS deps — no native compile.
# No BuildKit cache mounts: Railway requires service-scoped cache `id=...`, not suitable for a shared repo Dockerfile.

FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --no-audit --no-fund \
    && node -e "require('express'); console.log('deps ok')"

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
