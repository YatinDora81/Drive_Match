import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "@repo/config";
import healthController from "./controllers/health.controller.ts";
import { accessLog, context } from "./middleware/context.ts";
import { errorHandler, notFound } from "./middleware/error-handler.ts";
import { routes } from "./routes/index.ts";

export function createServer(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, !origin || env.WEB_ORIGIN.includes(origin));
      },
      exposedHeaders: ["X-Request-Id", "Retry-After", "RateLimit-Remaining"],
    }),
  );
  app.use(context);
  app.use(accessLog);

  app.use(express.json({ limit: "64kb" }));

  app.get("/health", healthController.health);
  app.get("/health/ready", healthController.ready);

  app.use("/api/v1", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
