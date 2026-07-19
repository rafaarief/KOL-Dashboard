FROM mcr.microsoft.com/playwright:v1.48.2-jammy AS base

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/worker ./apps/worker

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN pnpm install --frozen-lockfile --filter @kol-finder/worker...

WORKDIR /app/apps/worker

ENV NODE_ENV=production
CMD ["pnpm", "start"]
