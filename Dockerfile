FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY . .
RUN npm install --location=global npm@latest
RUN npm install
RUN npm run build

FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/package*.json ./
RUN npm install --location=global npm@latest
RUN npm install --omit=dev
COPY --from=builder /usr/src/app/dist/ .
EXPOSE 8080
CMD ["node", "server.js"]