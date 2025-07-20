import express from "express";
import * as fs from "fs";
import * as path from "path";
import { ZodError } from "zod";
import {
  trainRequestData,
  trainRequestSchema,
  trainResponseData,
} from "../schemas/train";
import validatePrLink from "../parse/validatePr";
import acquireRepo from "../parse/acquireRepo";
import { fetchDiffFiles } from "../parse/fetchDiffFiles";
import * as dotenv from "dotenv";
import generateContext from "../generate/generateContext";
import { GenerateSeniorStyleSheet } from "../generate/generateSeniorStyleSheet";
import { createLLMFromEnv } from "../schemas/LLM";
import { generateTests } from "../generate/generateTests";
import validateTests from "../generate/validateTests";
import removeFailingTests from "../generate/removeFailingTests";

dotenv.config();

const trainRouter = express.Router();

trainRouter.post("/", async (req, res) => {
  try {
    // 1) Validate request
    const data: trainRequestData = trainRequestSchema.parse(req.body);

    // 2) Validate PR URL & clone
    const validated = validatePrLink({ url: data.github_link });
    if (!validated.ok || !validated.cloneUrl) {
      return res
        .status(400)
        .json({ error: "Invalid input", issues: "wrong github link format" });
    }

    const repoPath = path.resolve("./repo");
    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
      console.log("[train] Cleared existing ./repo folder");
    }

    const repoData = acquireRepo({ cloneUrl: validated.cloneUrl });
    if (repoData.error) {
      return res
        .status(400)
        .json({ error: "Invalid input", issues: repoData.error });
    }

    // 3) Fetch diff
    const diffFiles = await fetchDiffFiles({
      owner: validated.owner!,
      githubToken: process.env.GITHUB_TOKEN!,
      repo: validated.repo!,
      prNumber: validated.prNumber!,
    });

    // 4) Build context
    const context = generateContext({
      diffFiles: diffFiles.diffFiles,
      repoRoot: repoData.repoRoot,
    });

    // 5) Generate senior style sheet (optional side‑effect)
    const llm = createLLMFromEnv();
    await GenerateSeniorStyleSheet({
      seniorContext: context,
      llmClient: llm,
    });

    // 6) Generate tests into ./repo/tests
    const testDir = path.join(repoPath, "tests");
    const tests = await generateTests({
      context,
      llmClient: llm,
      dryRun: false,
      testDir,
    });

    // 7) Validate generated tests
    const validation = await validateTests({
      testFiles: tests.proposedTests,
      testDir,
      repoRoot: repoData.repoRoot,
    });

    // 8) If some tests failed, strip them and re‑validate (optional)
    removeFailingTests({
      tests: tests.proposedTests,
      testResults: validation.result,
      testDir,
    });

    // 9) Respond with summary
    const response: trainResponseData = {
      ok: true,
    };
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

export default trainRouter;
