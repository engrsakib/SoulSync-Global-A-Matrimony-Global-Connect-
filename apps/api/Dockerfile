FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
RUN pnpm fetch

FROM base AS build
WORKDIR /app
COPY --from=deps /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @soulsync/db db:generate
RUN pnpm --filter @soulsync/api build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/db ./packages/db
EXPOSE 4000
CMD ["node", "dist/main.js"]
