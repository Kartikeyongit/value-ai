FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache openssl

# Install ALL dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npx tsc

FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache openssl

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/server.js"]
