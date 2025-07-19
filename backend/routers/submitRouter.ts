import express from "express";
import { ZodError } from "zod";
import {
  SubmitRequestData,
  SubmitRequestSchema,
  SubmitResponseData,
} from "../schemas/submit";

const submitRouter = express.Router();

submitRouter.post("/", async (req, res) => {
  try {
    const data: SubmitRequestData = SubmitRequestSchema.parse(req.body);

    // do submit magic here

    // return answer
    const result: SubmitResponseData = { ok: true };

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

export default submitRouter;
