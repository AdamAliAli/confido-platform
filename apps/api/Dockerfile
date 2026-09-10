FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter api... --frozen-lockfile=false
COPY apps/api apps/api
RUN pnpm --filter api prisma:generate && pnpm --filter api build
FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
CMD ["sh","-c","cd apps/api && npx prisma migrate deploy && node dist/main.js"]
