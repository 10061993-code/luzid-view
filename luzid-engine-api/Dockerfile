kFROM node:20-alpine AS base
WORKDIR /app

# nur Manifeste zuerst (Cache)
COPY package.json package-lock.json ./
COPY packages/content-engine/package.json packages/content-engine/package.json
RUN npm ci --omit=dev

# Code
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "packages/content-engine/server.mjs"]

