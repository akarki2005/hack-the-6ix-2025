import express from "express";
import { ZodError } from "zod";

import {
  finishedRequestData,
  finishedRequestSchema,
  finishedResponseData,
} from "../schemas/finish";

const finishRouter = express.Router();
finishRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const data: finishedRequestData = finishedRequestSchema.parse({
      id: id,
    });

    // fetch finished data for the id user

    const result: finishedResponseData = { completed: true };
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid input", issues: error.issues });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

export default finishRouter;
