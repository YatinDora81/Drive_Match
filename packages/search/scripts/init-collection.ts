import { env } from "@repo/config";
import { collectionName, ensureCollection } from "../src/vector/repository.ts";
import { qdrant } from "../src/vector/client.ts";

const recreate = process.argv.includes("--reset");

const result = await ensureCollection({ recreate });

if (!result.created) {
  const info = await qdrant.getCollection(collectionName);
  const params = info.config.params.vectors;
  const size =
    typeof params === "object" && params !== null && "size" in params
      ? params.size
      : null;
  const distance =
    typeof params === "object" && params !== null && "distance" in params
      ? params.distance
      : null;

  if (size !== env.EMBEDDING_DIMENSIONS || distance !== "Cosine") {
    console.error(
      `${collectionName} exists with size=${String(size)} distance=${String(distance)}, expected ${env.EMBEDDING_DIMENSIONS}/Cosine. Run with --reset to recreate it.`,
    );
    process.exit(1);
  }

  console.log(`${collectionName} already exists with ${result.points} points`);
  process.exit(0);
}

console.log(
  `created ${collectionName} with ${env.EMBEDDING_DIMENSIONS} dimensions`,
);
