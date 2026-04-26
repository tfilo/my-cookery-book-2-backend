FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY . .
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist/ .
COPY --from=builder /usr/src/app/src/openapi.json .
COPY --from=builder /usr/src/app/src/openapi-internal.json .
RUN npm install --omit=dev

VOLUME /app/uploads

EXPOSE 8080
CMD ["node", "server.js"]