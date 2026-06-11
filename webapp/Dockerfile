FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# NEXT_PUBLIC_* vars are inlined at build time, so they must be available here
ARG NEXT_PUBLIC_EXTENSION_ID
ENV NEXT_PUBLIC_EXTENSION_ID=$NEXT_PUBLIC_EXTENSION_ID
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
