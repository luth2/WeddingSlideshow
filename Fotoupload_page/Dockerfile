FROM node:20-alpine

LABEL org.opencontainers.image.licenses="GPL-3.0-only" \
    org.opencontainers.image.authors="https://github.com/luth2"

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    UPLOAD_DIR=/data/uploads

COPY package*.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY src ./src

RUN addgroup -S app && \
    adduser -S -G app -u 10001 app && \
    mkdir -p /data/uploads && \
    chown -R app:app /app /data

USER app

EXPOSE 8080

CMD ["node", "src/server.js"]
