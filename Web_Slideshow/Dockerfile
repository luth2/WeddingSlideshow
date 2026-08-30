FROM node:20-bookworm-slim

LABEL org.opencontainers.image.licenses="GPL-3.0-only" \
    org.opencontainers.image.authors="https://github.com/luth2"

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    PHOTO_DIR=/data/photos \
    SLIDESHOW_TITLE="Wedding Slideshow" \
    SLIDESHOW_INTERVAL_SECONDS=8

COPY package*.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY src ./src

RUN groupadd --gid 10001 app && \
    useradd --uid 10001 --gid app --no-create-home app && \
    mkdir -p /data/photos && \
    chown -R app:app /app /data

USER app

EXPOSE 8080

CMD ["node", "src/server.js"]