import express from "express";
import { ZodError } from "zod";
import {
  requestResultsRequestData,
  requestResultsRequestSchema,
  requestResultsResponseData,
} from "../schemas/results";
import { connectDB } from "../db/mongoose";
import Assessment from "../db/models/assessment"; // <-- model holding results

const resultRouter = express.Router();
resultRouter.get("/:id", async (req, res) => {
  try {
    // connect to Mongo once per process
    await connectDB();

    const { id } = req.params;
    const data: requestResultsRequestData = requestResultsRequestSchema.parse({
      id,
    });

    // query for the assessment / result by _id
    const doc = await Assessment.findById(data.id)
      .select("comments grade")
      .lean()
      .exec();

    if (!doc) {
      return res.status(404).json({ error: "Result not found" });
    }

    const result: requestResultsResponseData = {
      comments: doc.comments as string,
      grade: doc.grade as number,
    };

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
