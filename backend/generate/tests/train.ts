// train.ts

import * as fs from "fs";
import * as path from "path";
import validatePrLink from "../../parse/validatePr";
import acquireRepo from "../../parse/acquireRepo";
import { fetchDiffFiles } from "../../parse/fetchDiffFiles";
import generateContext from "../generateContext";
import { createLLMFromEnv } from "../../schemas/LLM";
import { GenerateSeniorStyleSheet } from "../generateSeniorStyleSheet";
import { generateTests } from "../generateTests";
import validateTests from "../validateTests";

(async function main() {
  const validated = validatePrLink({
    url: "https://github.com/akarki2005/hack-the-6ix-2025-tests/pull/2",
  });
  if (!validated.ok || !validated.cloneUrl) throw new Error("validate");

  console.error("validated");
  const repoPath = path.resolve("./repo");
  if (fs.existsSync(repoPath)) {
    fs.rmSync(repoPath, { recursive: true, force: true });
    console.log("[train] Cleared existing ./repo folder");
  }
  const repoData = acquireRepo({ cloneUrl: validated.cloneUrl });
  console.error("repo acquired");

  // Now all the `await` calls are inside this async function:
  const diffFiles = await fetchDiffFiles({
    owner: validated.owner!,
    githubToken: process.env.GITHUB_TOKEN!,
    repo: validated.repo!,
    prNumber: validated.prNumber!,
  });
  const context = generateContext({
    diffFiles: diffFiles.diffFiles,
    repoRoot: repoData.repoRoot,
  });
  const llm = createLLMFromEnv();
  const stylesheet = await GenerateSeniorStyleSheet({
    seniorContext: context,
    llmClient: llm,
  });
  const tests = await generateTests({
    context: context,
    llmClient: llm,
    dryRun: false,
    testDir: "./repo/tests",
  });
  console.error("tests generated");
  const test_validation = await validateTests({
    testFiles: tests.proposedTests,
    testDir: "./repo/tests",
    repoRoot: repoData.repoRoot,
  });

  console.error("tests validated");

  console.log(test_validation);
})();
