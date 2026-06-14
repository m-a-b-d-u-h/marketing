FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache ffmpeg
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 8000
CMD ["node", "server.js"]
