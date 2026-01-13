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
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/domain ./packages/domain
COPY packages/api ./packages/api
COPY packages/web ./packages/web

# Build (Vite needs the API_URL at build time if not using runtime env injection)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm -F @rent-stream/domain build
RUN pnpm -F @rent-stream/api build
RUN pnpm -F @rent-stream/web build

FROM nginx:stable-alpine AS runtime

# Copy built assets
COPY --from=build /app/packages/web/dist /usr/share/nginx/html

# Custom nginx config to support SPA routing
RUN printf "server {\n    listen 80;\n    location / {\n        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
