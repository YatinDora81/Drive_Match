import type { Request, Response } from "express";
import { parseRequestSchema, searchRequestSchema } from "@repo/contracts";
import searchService from "../services/search.service.ts";

class SearchController {
  search = async (req: Request, res: Response): Promise<void> => {
    const input = searchRequestSchema.parse(req.body);

    const data = await searchService.search(input, {
      requestId: req.id,
      log: req.log,
    });

    res.json({ data });
  };

  parse = async (req: Request, res: Response): Promise<void> => {
    const { query } = parseRequestSchema.parse(req.body);

    const data = await searchService.parse(query);

    res.json({ data });
  };
}

export default new SearchController();
