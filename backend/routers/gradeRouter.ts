import express from "express";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { ZodError } from "zod";
import {
  gradeRequestData,
  gradeRequestSchema,
  gradeResponseData,
} from "../schemas/grade";
import validatePrLink from "../parse/validatePr";
import acquireRepo from "../parse/acquireRepo";
import { createLLMFromEnv } from "../schemas/LLM";
import { gradeByAll } from "../generate/gradeByAll";
import { fetchDiffFiles } from "../parse/fetchDiffFiles";
import Assessment from "../db/models/assessment";
import { connectDB } from "../db/mongoose";

dotenv.config();

const gradeRouter = express.Router();

gradeRouter.post("/", async (req, res) => {
  try {
    // 1) Validate request body
    const data: gradeRequestData = gradeRequestSchema.parse(req.body);

    // 2) Validate PR URL & extract parts
    const validated = validatePrLink({ url: data.github_link });
    if (!validated.ok || !validated.cloneUrl) {
      return res
        .status(400)
        .json({ error: "Invalid input", issues: "wrong github link format" });
    }

    // 3) Fresh-clone the repo into ./repo
    const repoPath = path.resolve("./repo");
    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
      console.log("[grade] Cleared existing ./repo folder");
    }
    const repoData = acquireRepo({ cloneUrl: validated.cloneUrl });
    if (repoData.error) {
      return res
        .status(400)
        .json({ error: "Invalid input", issues: repoData.error });
    }

    // 4) Fetch PR file-diffs from GitHub
    const diffRes = await fetchDiffFiles({
      owner: validated.owner!,
      repo: validated.repo!,
      prNumber: validated.prNumber!,
      githubToken: process.env.GITHUB_TOKEN!,
    });
    if (diffRes.error) {
      return res.status(400).json({ error: diffRes.error });
    }
    const diffFiles = diffRes.diffFiles;

    // 5) Pull assessment to build queries
    await connectDB();
    const assessmentDoc: any = await Assessment.findOne({ repoName: data.repo }).lean();
    if (!assessmentDoc) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const queries = (assessmentDoc.criteria || []).map((c: any) => ({
      criteria_label: c.name,
      definition: c.description,
      importance: c.weight ?? 1,
    }));

    // 6) Run the all-in-one grader
    const llm = createLLMFromEnv();
    const { gradeReport } = await gradeByAll({
      diffFiles,
      newRepoRoot: repoData.repoRoot,
      llmClient: llm,
      queries,
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
    const updated = await Assessment.findOneAndUpdate(filter, update, options).exec();
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
