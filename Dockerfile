FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY . .
RUN npm install --location=global npm@latest
RUN npm install
RUN npm run build

FROM node:22-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/package*.json ./
RUN npm install --location=global npm@latest
RUN npm install --omit=dev
COPY --from=builder /usr/src/app/dist/ .
COPY --from=builder /usr/src/app/src/openapi.json .
COPY --from=builder /usr/src/app/src/openapi-internal.json .
EXPOSE 8080
CMD ["node", "server.js"]