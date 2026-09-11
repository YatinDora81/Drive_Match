FROM oven/bun:1.3.7-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps apps
COPY packages packages
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.7-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app ./
COPY . .
RUN cd apps/web && bun run build

FROM builder AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
WORKDIR /app/apps/web
CMD ["bun", "run", "start"]
