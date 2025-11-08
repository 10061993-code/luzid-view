# ---- Base image ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Install only package manifests first (better cache) ----
COPY package.json package-lock.json ./
COPY packages/content-engine/package.json packages/content-engine/package.json

RUN npm ci --omit=dev

# ---- Copy source ----
COPY . .

# ---- Environment ----
ENV NODE_ENV=production
ENV PORT=3000

# ---- Start ----
EXPOSE 3000
CMD ["node", "packages/content-engine/server.mjs"]

