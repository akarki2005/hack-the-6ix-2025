import express from "express";
import { ZodError } from "zod";
import {
  trainRequestData,
  trainRequestSchema,
  trainResponseData,
} from "../schemas/train";
import validatePrLink from "../parse/validatePr";
import acquireRepo from "../parse/acquireRepo";

const trainRouter = express.Router();

trainRouter.post("/", async (req, res) => {
  try {
    // Validate request body against schema
    const data: trainRequestData = trainRequestSchema.parse(req.body);

    // do training magic here
    // 1. git clone the repo
    const validated = validatePrLink({ url: data.github_link });
    if (!validated.ok) {
      res
        .status(400)
        .json({ error: "Invalid input", issues: "wrong github link format" });
    }

    const repoData = acquireRepo({ cloneUrl: data.github_link });

    if (repoData.error) {
      res.status(400).json({ error: "Invalid input", issues: repoData.error });
    }

    // 2. somehow train the LLM on the repo.

    // return answer
    const result: trainResponseData = { ok: true };

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle validation errors
      res.status(400).json({ error: "Invalid input", issues: error.message });
    } else if (error instanceof Error) {
      // Handle known errors
      res.status(500).json({ error: error.message });
    } else {
      // Handle unknown errors
      res.status(500).json({ error: "Unknown server error" });
    }
  }
});

export default trainRouter;
