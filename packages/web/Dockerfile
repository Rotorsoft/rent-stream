FROM node:20-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

RUN pnpm install --frozen-lockfile

COPY packages/domain ./packages/domain
COPY packages/api ./packages/api
COPY packages/web ./packages/web

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm -F @rent-stream/domain build && \
    pnpm -F @rent-stream/api build && \
    pnpm -F @rent-stream/web build

FROM nginx:alpine
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
