import pLimit from "p-limit";
import { env } from "@repo/config";
import { AppError, isAppError } from "@repo/contracts";
import { callGemini } from "../gemini/key-ring.ts";
import { batched } from "../lib/batched.ts";
import { LruCache } from "../lib/lru.ts";

const BATCH_SIZE = 32;

const limit = pLimit(env.INDEX_CONCURRENCY);

const queryCache = new LruCache<number[]>(2_000, env.PARSE_CACHE_TTL_MS);
const inflight = new Map<string, Promise<number[]>>();

export type QueryEmbedding = { vector: number[]; cached: boolean };

const queryKey = (text: string): string =>
  `${env.EMBEDDING_MODEL}|${env.EMBEDDING_DIMENSIONS}|RETRIEVAL_QUERY|${text.trim().toLowerCase()}`;

export async function embedQuery(text: string): Promise<QueryEmbedding> {
  const key = queryKey(text);
  const hit = queryCache.get(key);
  if (hit) return { vector: hit, cached: true };

  const pending = inflight.get(key);
  if (pending) return { vector: await pending, cached: true };

  const run = embedBatch([text], "RETRIEVAL_QUERY", {
    waitForCooldown: false,
  }).then(([vector]) => {
    if (!vector) {
      throw new AppError(
        "EMBEDDING_FAILED",
        "Embedding request returned no vector",
      );
    }
    queryCache.set(key, vector);
    return vector;
  });

  inflight.set(key, run);

  try {
    return { vector: await run, cached: false };
  } finally {
    inflight.delete(key);
  }
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results = await Promise.all(
    batched(texts, BATCH_SIZE).map((batch) =>
      limit(() => embedBatch(batch, "RETRIEVAL_DOCUMENT")),
    ),
  );

  return results.flat();
}

async function embedBatch(
  texts: string[],
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT",
  options: { waitForCooldown?: boolean } = {},
): Promise<number[][]> {
  let response;

  try {
    response = await callGemini(
      "embedding text",
      (client) =>
        client.models.embedContent({
          model: env.EMBEDDING_MODEL,
          contents: texts.map((text) => ({ role: "user", parts: [{ text }] })),
          config: { outputDimensionality: env.EMBEDDING_DIMENSIONS, taskType },
        }),
      options,
    );
  } catch (error) {
    if (isAppError(error) && error.code === "RATE_LIMITED") throw error;
    throw new AppError(
      "EMBEDDING_FAILED",
      error instanceof Error ? error.message : "Embedding failed",
    );
  }

  const embeddings = response.embeddings ?? [];

  if (embeddings.length !== texts.length) {
    throw new AppError(
      "EMBEDDING_FAILED",
      `Embedding count mismatch: asked for ${texts.length}, received ${embeddings.length}`,
    );
  }

  return embeddings.map((embedding, index) => {
    const values = embedding.values;

    if (!values || values.length !== env.EMBEDDING_DIMENSIONS) {
      throw new AppError(
        "EMBEDDING_FAILED",
        `Embedding ${index} has ${values?.length ?? 0} dimensions, expected ${env.EMBEDDING_DIMENSIONS}`,
      );
    }

    return normalize(values);
  });
}

function normalize(vector: number[]): number[] {
  let sumOfSquares = 0;
  for (const value of vector) sumOfSquares += value * value;

  const magnitude = Math.sqrt(sumOfSquares);
  if (magnitude === 0 || Math.abs(magnitude - 1) < 1e-6) return vector;

  return vector.map((value) => value / magnitude);
}
