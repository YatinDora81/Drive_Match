-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('HATCHBACK', 'SEDAN', 'SUV', 'MPV', 'COUPE', 'PICKUP');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "Parser" AS ENUM ('LLM', 'HEURISTIC', 'OVERRIDE');

-- CreateEnum
CREATE TYPE "SearchMode" AS ENUM ('VECTOR', 'STRUCTURED');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "price" INTEGER NOT NULL,
    "kmDriven" INTEGER NOT NULL,
    "ownerCount" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL,
    "safetyRating" INTEGER,
    "mileageKmpl" DOUBLE PRECISION,
    "rangeKm" INTEGER,
    "engineCc" INTEGER,
    "batteryKwh" DOUBLE PRECISION,
    "powerBhp" INTEGER,
    "color" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "registrationState" TEXT NOT NULL,
    "features" TEXT[],
    "description" TEXT NOT NULL,
    "contentHash" TEXT,
    "embeddingModel" TEXT,
    "indexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" TEXT NOT NULL,
    "query" VARCHAR(500) NOT NULL,
    "requestId" TEXT,
    "status" INTEGER NOT NULL,
    "errorCode" TEXT,
    "parser" "Parser",
    "parsed" JSONB,
    "mode" "SearchMode",
    "rankedBy" TEXT,
    "degraded" BOOLEAN NOT NULL DEFAULT false,
    "explain" BOOLEAN NOT NULL DEFAULT false,
    "offset" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL DEFAULT 0,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER,
    "exact" BOOLEAN NOT NULL DEFAULT true,
    "relaxed" JSONB,
    "warnings" JSONB,
    "topScore" DOUBLE PRECISION,
    "understandingCached" BOOLEAN NOT NULL DEFAULT false,
    "embeddingCached" BOOLEAN NOT NULL DEFAULT false,
    "understandingModel" TEXT,
    "embeddingModel" TEXT,
    "parseMs" INTEGER NOT NULL DEFAULT 0,
    "embedMs" INTEGER NOT NULL DEFAULT 0,
    "searchMs" INTEGER NOT NULL DEFAULT 0,
    "totalMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_bodyType_price_idx" ON "vehicles"("bodyType", "price");

-- CreateIndex
CREATE INDEX "vehicles_fuelType_transmission_idx" ON "vehicles"("fuelType", "transmission");

-- CreateIndex
CREATE INDEX "vehicles_make_model_idx" ON "vehicles"("make", "model");

-- CreateIndex
CREATE INDEX "vehicles_price_idx" ON "vehicles"("price");

-- CreateIndex
CREATE INDEX "vehicles_kmDriven_idx" ON "vehicles"("kmDriven");

-- CreateIndex
CREATE INDEX "vehicles_year_idx" ON "vehicles"("year");

-- CreateIndex
CREATE INDEX "vehicles_city_idx" ON "vehicles"("city");

-- CreateIndex
CREATE INDEX "search_logs_createdAt_idx" ON "search_logs"("createdAt" DESC);
