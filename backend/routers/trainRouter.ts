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
dotenv.config();

const trainRouter = express.Router();

trainRouter.post("/", async (req, res) => {
  try {
    // Validate request body against schema
    const data: trainRequestData = trainRequestSchema.parse(req.body);

    // validate the prlink
    const validated = validatePrLink({ url: data.github_link });
    if (!validated.ok || !validated.cloneUrl) {
      return res
        .status(400)
        .json({ error: "Invalid input", issues: "wrong github link format" });
    }

    console.error("validated");

    // git clone the repo

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

    console.error("repo acquried");

    // fetch diff files

    const diffFiles = await fetchDiffFiles({
      owner: validated.owner!,
      githubToken: process.env.GITHUB_TOKEN!,
      repo: validated.repo!,
      prNumber: validated.prNumber!,
    });

    // generate the context

    const context = generateContext({
      diffFiles: diffFiles.diffFiles,
      repoRoot: repoData.repoRoot,
    });

    console.error("context made");

    const llm = createLLMFromEnv();

    // generate the style sheet

    const stylesheet = GenerateSeniorStyleSheet({
      seniorContext: context,
      llmClient: llm,
    });

    console.error("style made");

    // generate the tests

    // need to set the testDir variable to directly inside the student repo in order for the tests to work

    const tests = await generateTests({
      context: context,
      llmClient: llm,
      dryRun: false,
      testDir: "./repo/tests",
    });

    // const test_validation = await validateTests({
    //   testFiles: tests.proposedTests,
    //   testDir: "./repo/tests",
    // });

    // console.error("tests validated");

    // console.log(test_validation);

    // if (test_validation.result.failedTests) {
    // console.error("ai generated tests do not work");
    // }

    // somehow train the LLM on the repo.

    // return answer
    const result: trainResponseData = { ok: true };

    return res.status(200).json(result);
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
