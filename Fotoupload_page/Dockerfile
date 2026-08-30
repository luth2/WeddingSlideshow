FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    UPLOAD_DIR=/data/uploads

COPY package*.json ./
RUN npm install --omit=dev

COPY public ./public
COPY src ./src

RUN addgroup -S app && \
    adduser -S -G app -u 10001 app && \
    mkdir -p /data/uploads && \
    chown -R app:app /app /data

USER app

EXPOSE 8080

CMD ["node", "src/server.js"]
