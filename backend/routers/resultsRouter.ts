import express from "express";
import { ZodError } from "zod";
import {
  requestResultsRequestData,
  requestResultsRequestSchema,
  requestResultsResponseData,
} from "../schemas/results";

const resultRouter = express.Router();
resultRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const data: requestResultsRequestData = requestResultsRequestSchema.parse({
      id: id,
    });

    // fetch the results data for the id user

    const result: requestResultsResponseData = { comments: "todo", grade: 100 };
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid input", issues: error.issues });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

export default resultRouter;
