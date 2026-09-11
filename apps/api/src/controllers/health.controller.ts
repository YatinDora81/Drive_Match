import type { Request, Response } from "express";
import healthService from "../services/health.service.ts";

class HealthController {
  health = (_req: Request, res: Response): void => {
    res.json({ data: healthService.liveness() });
  };

  ready = async (req: Request, res: Response): Promise<void> => {
    const data = await healthService.readiness(req.log);

    res.status(data.status === "ok" ? 200 : 503).json({ data });
  };
}

export default new HealthController();
