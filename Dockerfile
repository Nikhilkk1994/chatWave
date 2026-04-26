# Pure JS deps — no native compile.
# No BuildKit cache mounts: Railway requires service-scoped cache `id=...`, not suitable for a shared repo Dockerfile.

FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./

# Node image ships npm 10.x; Railway/Docker often hit npm "Exit handler never called" on npm ci.
# Bump npm, then install; verify express exists on disk before require() so a bogus success fails the layer.
RUN npm install -g npm@11.13.0 \
    && npm ci --omit=dev --no-audit --no-fund \
    && test -f node_modules/express/package.json \
    && node -e "require('express'); console.log('deps ok')"

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
