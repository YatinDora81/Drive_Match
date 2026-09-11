import { z } from "zod";
import { parseGeminiKeys } from "./gemini-keys.ts";

const schema = z.object({
  DATABASE_URL: z.url(),

  QDRANT_URL: z.url(),
  QDRANT_API_KEY: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  QDRANT_COLLECTION: z.string().min(1).default("vehicles"),

  GEMINI_API_KEYS: z
    .string()
    .min(1)
    .transform((value, ctx) => {
      try {
        return parseGeminiKeys(value);
      } catch (error) {
        ctx.addIssue({
          code: "custom",
          message: error instanceof Error ? error.message : String(error),
        });
        return z.NEVER;
      }
    }),

  EMBEDDING_MODEL: z.string().min(1).default("gemini-embedding-2"),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  GENERATION_MODEL: z.string().min(1).default("gemini-3.6-flash"),
  UTILITY_MODEL: z.string().min(1).default("gemini-3.5-flash-lite"),

  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z
    .string()
    .default("http://localhost:3000")
    .transform((value, ctx) => {
      const origins = value
        .split(",")
        .map((entry) => entry.trim().replace(/\/+$/, ""))
        .filter((entry) => entry.length > 0);

      for (const origin of origins) {
        if (!/^https?:\/\/[^/]+$/i.test(origin)) {
          ctx.addIssue({
            code: "custom",
            message: `"${origin}" is not a bare http(s) origin`,
          });
          return z.NEVER;
        }
      }

      return origins;
    }),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  SEARCH_DEFAULT_LIMIT: z.coerce.number().int().min(1).max(100).default(12),
  SEARCH_MAX_LIMIT: z.coerce.number().int().min(1).max(100).default(50),
  SEMANTIC_SCORE_THRESHOLD: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
        ctx.addIssue({
          code: "custom",
          message: "must be a number between 0 and 1",
        });
        return z.NEVER;
      }
      return parsed;
    }),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  PARSE_CACHE_TTL_MS: z.coerce.number().int().min(0).default(600_000),
  INDEX_CONCURRENCY: z.coerce.number().int().min(1).max(16).default(4),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid environment. Copy .env.example to .env and fill in the missing values.\n${detail}`,
    );
  }

  return parsed.data;
}

export const env = load();
