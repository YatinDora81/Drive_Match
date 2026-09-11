# Drive Match

An AI vehicle search engine. Users describe the car they want in plain language ("Show SUVs under ₹15L", "Diesel automatic cars below 80k km", "Family cars with high safety ratings") and get matching listings from a catalogue of used cars in India, with the interpretation shown back to them so they can correct it.

Live at [drive-match.yatindora.in](https://drive-match.yatindora.in/).

## Stack

Turborepo · Bun · Express 5 · Prisma 7 / Postgres · Qdrant · Gemini · Next.js 16

| Model                   | Used for                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `gemini-embedding-2`    | embeddings, 1536 dims, `RETRIEVAL_DOCUMENT` for the catalogue and `RETRIEVAL_QUERY` for searches |
| `gemini-3.6-flash`      | query understanding and the optional result summary                                              |
| `gemini-3.5-flash-lite` | hedges query understanding when the generation model is slow                                     |

## Layout

```
apps/
  api/        Express 5 http api. Class based controllers and services, one singleton instance each
  web/        Next.js app
packages/
  config/     zod validated env + gemini key ring parsing
  contracts/  zod request schemas, error codes, AppError, the shared response types
  db/         Prisma schema, client, seed
  catalogue/  deterministic synthetic catalogue (320 cars), data/vehicles.json, the text each car is embedded as
  search/     gemini key ring, embedder, qdrant repository, query parsers, relaxation ladder, retrieval
  logger/     pino factory
```

`packages/search` has no http dependencies. The api orchestrates its pieces from `apps/api/src/services/search.service.ts`.

## Setup

### With Docker

```bash
cp .env.example .env          # fill in GEMINI_API_KEYS, the rest already works
docker compose up
```

That brings up postgres and qdrant, waits for both to pass a healthcheck, runs migrations + seed + the Qdrant collection bootstrap once (`migrate`), embeds the catalogue in a second one-shot that retries on failure (`index`), then starts the api on :4000 and the web app on :3000. The api serves structured searches from Postgres before the index finishes and switches to similarity ranking as soon as vectors land.

Set `HOSTED_DATABASE_URL`, `HOSTED_QDRANT_URL` / `HOSTED_QDRANT_API_KEY` in `.env` and compose points the containers at the hosted service instead of the bundled one. (`DATABASE_URL` and `QDRANT_URL` stay as your local-machine values; inside the containers they are overridden.)

### Without Docker

```bash
cp .env.example .env          # fill in DATABASE_URL, QDRANT_URL, QDRANT_API_KEY, GEMINI_API_KEYS
docker compose up -d postgres qdrant   # skip if you use hosted ones
bun install
bun run db:generate           # the generated Prisma client is gitignored
bun run db:deploy             # or db:migrate if you are changing the schema
bun run db:seed               # 320 vehicles from packages/catalogue/data/vehicles.json, idempotent
bun run qdrant:init           # collection + payload indexes, asserts dims/distance if it already exists
bun run catalogue:index       # embeds whatever is not indexed yet, resumable
bun run dev
bun run smoke                 # hits the running api with the example queries
```

`db:generate` is the step a fresh clone forgets. `check-types`, `build`, `test` and `dev` all depend on it in `turbo.json`.

### Environment

`GEMINI_API_KEYS` is a rotating key ring. Each entry is `NAME__SPLIT__KEY`, entries separated by commas:

```
GEMINI_API_KEYS="alpha__SPLIT__AIza...,beta__SPLIT__AIza..."
```

The ring round robins across keys, backs a key off on 429 or 5xx, and permanently drops a key that answers 401 or 403 so one revoked key cannot fail a request. On the search path a call never waits for a cooling key; it fails fast so the stage can fall back. `GET /api/v1/health/ready` reports the live state of the ring.

A missing or malformed variable crashes on boot with the offending field named.

## API

Every success is `{ "data": ... }`. Every failure is:

```json
{
  "error": {
    "code": "UNSUPPORTED_QUERY",
    "message": "That doesn't look like a vehicle search. Try describing the car you want.",
    "details": { "examples": ["Show SUVs under ₹15L", "..."] },
    "requestId": "8159d6e7-..."
  }
}
```

```
POST /api/v1/search            200  natural language search
POST /api/v1/search/parse      200  the understanding step alone, for inspection
GET  /api/v1/vehicles          200  structured listing, keyset paginated, no model call
GET  /api/v1/vehicles/facets   200  distinct values with counts, min/max ranges
GET  /api/v1/vehicles/:id      200
GET  /api/v1/health            200  liveness
GET  /api/v1/health/ready      200  postgres + qdrant + key ring + index counts, 503 only when postgres is down
GET  /health, /health/ready    200  same two, unprefixed, for platform probes
```

| Code                    | Status | When                                                                                            |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR`      | 400    | zod rejected the body or query string, `details` lists the fields                               |
| `NOT_FOUND`             | 404    | unknown vehicle id or route                                                                     |
| `CONTENT_TOO_LARGE`     | 413    | body over 64 kb                                                                                 |
| `UNSUPPORTED_QUERY`     | 422    | the model says the text is not about finding a car and the regex parser found no filters either |
| `RATE_LIMITED`          | 429    | 60 searches per minute per ip, `Retry-After` set                                                |
| `SERVICE_UNAVAILABLE`   | 503    | semantic search is down and the query carried no filter to serve from Postgres                  |
| `CATALOGUE_UNAVAILABLE` | 503    | Postgres is unreachable                                                                         |
| `INTERNAL`              | 500    | anything unhandled, logged with the request id                                                  |

### `POST /search`

```json
{
  "query": "Diesel automatic cars below 80k km",
  "limit": 12,
  "offset": 0,
  "explain": false
}
```

Response (abridged):

```json
{
  "data": {
    "query": "Diesel automatic cars below 80k km",
    "understood": {
      "isVehicleQuery": true,
      "hasSemanticIntent": false,
      "semanticQuery": "Diesel automatic car with less than 80,000 km driven",
      "filters": {
        "fuelTypes": ["DIESEL"],
        "transmissions": ["AUTOMATIC"],
        "kmMax": 80000
      },
      "sort": null,
      "notes": "Filtered for diesel fuel, automatic transmission, and maximum 80,000 km driven.",
      "warnings": [],
      "parser": "llm"
    },
    "requested": {
      "fuelTypes": ["DIESEL"],
      "transmissions": ["AUTOMATIC"],
      "kmMax": 80000
    },
    "applied": {
      "fuelTypes": ["DIESEL"],
      "transmissions": ["AUTOMATIC"],
      "kmMax": 80000
    },
    "results": [
      {
        "vehicle": { "...": "..." },
        "score": null,
        "rank": 1,
        "matchedFeatures": []
      }
    ],
    "summary": null,
    "meta": {
      "total": 43,
      "returned": 12,
      "limit": 12,
      "offset": 0,
      "hasMore": true,
      "capped": false,
      "exact": true,
      "relaxed": [],
      "mode": "structured",
      "rankedBy": "default",
      "degraded": false,
      "cache": { "understanding": false, "embedding": false },
      "catalogueSize": 320,
      "requestId": "...",
      "timings": {
        "parseMs": 3509,
        "embedMs": 0,
        "searchMs": 15,
        "hydrateMs": 2,
        "explainMs": 0,
        "totalMs": 3526
      },
      "model": {
        "generation": "gemini-3.6-flash",
        "embedding": "gemini-embedding-2"
      }
    }
  }
}
```

**Override mode.** Send `filters` and the api skips understanding, normalises the names against the catalogue vocabulary and uses the result as the complete filter set, disables relaxation and reports `parser: "override"`. `semanticQuery` (default: the query) is embedded unless `hasSemanticIntent` is false; `sort` is honoured. The web app uses this for two things: removing an "understood" chip, and fetching page 2+ with `filters: data.applied` so every page is a deterministic continuation of page 1 even if the catalogue or the model's mood changed in between.

**Filters** (`packages/contracts/src/search.schema.ts`): `bodyTypes[]`, `fuelTypes[]`, `transmissions[]`, `makes[]`, `models[]`, `cities[]`, `colors[]`, `features[]`, `excludeBodyTypes[]`, `excludeFuelTypes[]`, `excludeMakes[]`, `priceMin/Max` (INR), `kmMin/Max`, `yearMin/Max`, `seatsMin/Max`, `safetyRatingMin`, `ownerCountMax`, `mileageMin` (kmpl), `rangeMin` (km). A make list and a model list are OR-ed ("a Hyundai or a Tata Nexon" keeps both) and a model pins its make. `features` and `colors` are preferences: they boost ranking and are reported per result as `matchedFeatures`, they never exclude a car.

## How a search works

1. **Validate.** zod, strict object, unknown keys rejected.
2. **Understand.** `gemini-3.6-flash` with a JSON response schema (enums for body/fuel/transmission/features, nullable numbers) and `thinkingLevel: MINIMAL`, temperature 0. The system prompt carries the Indian conventions (lakh, crore, "80k km", "under 15" means ₹15 lakh, "recent" means the last three years, "family" means five seats plus soft intent, "not diesel" is an exclusion, superlatives become a sort) and the catalogue vocabulary (makes, models, cities, colours, features) so "Cretta" resolves to Hyundai Creta and "bombay" to Mumbai. The call is **hedged**: if the generation model has not answered in 1.5 s, `gemini-3.5-flash-lite` is asked too and the first answer wins. After 8 s, or if both fail, a deterministic regex parser takes over (`parser: "heuristic"`), so a Gemini outage degrades to keyword search rather than to a 502. Parses are cached (LRU, 10 min, keyed on model + prompt version + day + normalised query) and single-flighted.
3. **Normalise.** Every name is canonicalised against the vocabulary loaded from Postgres, features are restricted to the closed list, inverted ranges are swapped, out-of-range values dropped field by field with a warning, and a price the model got 5x wrong is replaced by the regex parser's reading (a dropped zero in "10 lakhs" is the most common model slip).
4. **Count.** Postgres is the source of truth for membership: `count(where)` with the same filter semantics the vector path uses. Zero and the query was not an override: walk the **relaxation ladder**, widen before drop, least important first (drop city, then loosen safety 4 -> 3, owners, seats, year -2, km x1.25, budget x1.15, ..., drop body type), at most four steps, never touching fuel, gearbox, make, model or exclusions. Each step is returned as `{ code, field, from, to, message }` and the response says `exact: false`.
5. **Rank.** Two paths.
   - _vector_, when the query has semantic intent and no sort: embed `semanticQuery`, ask Qdrant for the top 100 candidates under the payload filter, boost in memory for requested features (+0.06 each) and colour (+0.03), slice the page. Every page of a query is a slice of the same ranked list; `meta.capped` is true when more than 100 cars matched and the tail is not reachable by paging.
   - _structured_, for sorted queries ("cheapest"), queries with no soft intent ("automatic Creta in Delhi"), and as the fallback when embedding or Qdrant fails or the collection is not indexed yet: Postgres `findMany` with `orderBy` (nulls last) and `skip/take`. `meta.degraded` says when this path was a fallback.
6. **Hydrate.** One `findMany` by id, order preserved, misses logged.
7. **Explain** (optional, `explain: true`): one more hedged model call writes a two sentence summary; failure yields `summary: null`, never a failed search.
8. **Log.** A `search_logs` row per request including failures (status, error code, parser, mode, cache hits, timings, relaxed steps), plus a pino funnel line. A vague result at `topScore: 0.48` is a retrieval problem; the same result at `0.74` is a prompt problem.

Every stage has its own budget (parse 8 s, embed 3 s, Qdrant 4 s, explain 6 s) and a defined fallback, so the request path is bounded even when every upstream is slow.

## The catalogue

`packages/catalogue` generates 320 listings from a seeded PRNG: 60 real model lines with their actual body types, seats, engines, gearboxes, NCAP stars and new-price bands, depreciated by age, kilometres and owners into believable used prices, across 14 Indian cities. The output is committed as `data/vehicles.json`; the same uuid is the Postgres primary key and the Qdrant point id, so a reseed is idempotent on both sides and the two stores never need a mapping table.

Each car is embedded as one paragraph produced by `describeVehicle()`: every attribute in words ("₹14.5 lakh", "42,000 km", "5-star Global NCAP safety", "7 seater family") plus use-case phrases derived from the data (seven seats -> "large family", CNG or 20+ kmpl -> "low running cost", high power -> "fun to drive"), so adjective queries have something to match.

## Checks and evaluation

```bash
bun run check-types
bun run smoke                              # the example queries against a running api
cd packages/search && bun run eval:llm     # the live understanding step against eval/golden.json
```

`packages/search/eval/golden.json` holds 25 queries with their expected canonical filters and sort: the three assignment examples, ranges, negations, make/model pairs, superlatives, EV range, typos. `eval:llm` runs them through the live understanding step and prints exact-match rate and per-field agreement. Unit tests are kept out of the repository by `.gitignore`.

## Tradeoffs

**Two stores.** Postgres owns the record and the counts; Qdrant owns the vectors and the payload needed to filter. At 320 rows pgvector in one transaction would be simpler. Qdrant is a bet on catalogue growth and on keeping vector load off the primary. The dual write is mitigated by deterministic ids, a resumable indexer keyed on a content hash, `indexedAt` set only after the upsert lands, and `/health/ready` reporting both counts.

**LLM parse on the hot path.** It is the most valuable step (typos, Hinglish, "family" -> seats + intent, negations) and the slowest. Hedging, caching, single-flight and the regex floor keep p95 bounded; a production system would pre-parse popular queries and stream results while the summary generates.

**Relaxation.** Honest by construction: the response carries `requested`, `applied` and every step taken, and the UI renders violations per card. The alternative, quietly returning nearest neighbours, is how search engines lose trust.

**Features as preferences.** With a small catalogue a hard feature filter plus any other constraint is nearly always empty. Reranking keeps "sunroof" meaningful without opening every search on the relaxed banner.

**What breaks at scale.** In-memory caches and rate limits are per process, wants Redis · the vector window of 100 caps deep pagination · vocabulary refresh is a timer, wants an event · no lexical/BM25 signal, wants hybrid retrieval with RRF once the catalogue outgrows the payload filter · no auth or tenancy.

## Frontend

`apps/web` is a Next.js 16 App Router client, a sibling of Findable's editorial look: warm paper, hairline rules, one accent, mono for data. A sticky search bar, the three example chips, an "understood as" chip row (unit-aware labels, removable, which re-searches in override mode), an honest counter ("0 exact matches · 23 close matches"), a relaxed banner listing each step with a Restore action, buyer-first cards (price largest, then year make model, then km · owner · city, NCAP with "Not rated" distinct from 0 stars, matched features first), a detail sheet, load-more as a deterministic continuation, an on-demand AI summary, `?q=` in the URL, recent searches in localStorage, light and dark themes.
