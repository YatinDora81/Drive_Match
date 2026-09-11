import { Router } from "express";
import healthController from "../controllers/health.controller.ts";
import searchController from "../controllers/search.controller.ts";
import vehicleController from "../controllers/vehicle.controller.ts";
import { rateLimit } from "../middleware/rate-limit.ts";

export const routes: Router = Router();

const searchLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many searches from this address, slow down for a minute",
});

routes.get("/health", healthController.health);
routes.get("/health/ready", healthController.ready);

routes.post("/search", searchLimit, searchController.search);
routes.post("/search/parse", searchLimit, searchController.parse);

routes.get("/vehicles/facets", vehicleController.facets);
routes.get("/vehicles", vehicleController.list);
routes.get("/vehicles/:id", vehicleController.get);
