# Build from the repo root: docker build -f apps/api/Dockerfile .
FROM node:22-bookworm-slim AS build
RUN npm install -g pnpm@10.28.0
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile --filter @housingcom/api...
RUN pnpm --filter @housingcom/api... build
RUN pnpm --filter @housingcom/api deploy --prod --legacy /out && cp -r apps/api/dist /out/dist

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
RUN mkdir -p /data/storage && chown -R node:node /data
USER node
EXPOSE 4000
CMD ["sh", "-c", "node_modules/.bin/typeorm -d dist/core/database/data-source.js migration:run && node dist/core/database/seeds/run-seeds.js && exec node dist/main.js"]
