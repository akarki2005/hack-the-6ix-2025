import express from "express";
import * as dotenv from "dotenv";
import { ZodError } from "zod";
import {
  gradeRequestData,
  gradeRequestSchema,
  gradeResponseData,
} from "../schemas/grade";
import { gradeByAll } from "../generate/gradeByAll";
import Assessment from "../db/models/assessment";
import { connectDB } from "../db/mongoose";

dotenv.config();

const gradeRouter = express.Router();

gradeRouter.post("/", async (req, res) => {
  try {
    // 1) Validate request body
    const data: gradeRequestData = gradeRequestSchema.parse(req.body);

    // 5) Pull assessment to build queries
    await connectDB();
    const assessmentDoc: any = await Assessment.findOne({
      repoName: data.repo,
    }).lean();
    if (!assessmentDoc) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const queries = (assessmentDoc.criteria || []).map((c: any) => ({
      criteria_label: c.name,
      definition: c.description,
      importance: c.weight ?? 1,
    }));

    // 6) Run the all-in-one grader
    const { gradeReport } = await gradeByAll({
      repoDestination: data.repo,
      github_token: process.env.GITHUB_TOKEN,
      queries: queries,
      student_github_link: data.github_link,
    });

    // 7) Persist results back to MongoDB
    const filter = {
      repoName: data.repo,
      "candidates.githubUsername": data.user,
    };
    const update = {
      $set: {
        "candidates.$.gradeReport": gradeReport,
        "candidates.$.score": gradeReport?.overall?.weightedScore ?? null,
      },
    };
    const options = { new: true };
    const updated = await Assessment.findOneAndUpdate(
      filter,
      update,
      options
    ).exec();
    if (!updated) {
      return res
        .status(404)
        .json({ error: "Candidate not found in assessment" });
    }

    // 8) Respond success
    const response: gradeResponseData = { ok: true };
    return res.status(200).json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid input", issues: error.message });
    } else if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Unknown server error" });
  }
});

export default gradeRouter;
