import type { Request, Response } from "express";
import { listVehiclesSchema, vehicleIdSchema } from "@repo/contracts";
import vehicleService from "../services/vehicle.service.ts";

class VehicleController {
  list = async (req: Request, res: Response): Promise<void> => {
    const input = listVehiclesSchema.parse(req.query);

    const { data, nextCursor } = await vehicleService.list(input);

    res.json({ data, nextCursor });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { id } = vehicleIdSchema.parse(req.params);

    const data = await vehicleService.get(id);

    res.json({ data });
  };

  facets = async (_req: Request, res: Response): Promise<void> => {
    const data = await vehicleService.facets();

    res.setHeader("Cache-Control", "public, max-age=60");
    res.json({ data });
  };
}

export default new VehicleController();
