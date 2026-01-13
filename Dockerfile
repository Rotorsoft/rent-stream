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

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source files
COPY packages/domain ./packages/domain
COPY packages/api ./packages/api

# Build
RUN pnpm -F @rent-stream/domain build
RUN pnpm -F @rent-stream/api build

FROM base AS runtime
WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/domain/node_modules ./packages/domain/node_modules
COPY --from=build /app/packages/domain/dist ./packages/domain/dist
COPY --from=build /app/packages/domain/package.json ./packages/domain/
COPY --from=build /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=build /app/packages/api/dist ./packages/api/dist
COPY --from=build /app/packages/api/package.json ./packages/api/
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "packages/api/dist/index.js"]
