FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN --mount=type=cache,id=cacheKey=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source files
COPY packages/domain ./packages/domain
COPY packages/api ./packages/api

# Build
RUN pnpm -F @rent-stream/domain build
RUN pnpm -F @rent-stream/api build

# Deploy the API package to a standalone directory
RUN pnpm --filter=@rent-stream/api --prod deploy /app/out

FROM base AS runtime
WORKDIR /app

# Copy deployed standalone package
COPY --from=build /app/out ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]