FROM oven/bun:1.3.7-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps apps
COPY packages packages
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.7-alpine AS runner
WORKDIR /app
COPY --from=deps /app ./
COPY . .
RUN cd packages/db \
  && DATABASE_URL="postgresql://placeholder" bun --bun run prisma generate

WORKDIR /app/packages/search
CMD ["bun", "scripts/index-catalogue.ts"]
