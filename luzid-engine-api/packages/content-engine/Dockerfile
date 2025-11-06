FROM node:20-alpine

WORKDIR /app

# Nur package.json / lock zuerst, um Caching zu nutzen
COPY package*.json ./
RUN npm ci --omit=dev

# App-Code
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Healthcheck ruft unsere /api/health
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

CMD ["node", "server.mjs"]

