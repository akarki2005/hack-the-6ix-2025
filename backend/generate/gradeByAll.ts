import {
  GradeReport,
  RepoFile,
  SeniorContext,
  SeniorStyleSheet,
} from "../schemas/analysis";

import { gradeByCriteria } from "./gradeByCriteria";
import { gradeByTests } from "./gradeByTests";
import { gradeBySeniorStyleSheet } from "./gradeBySeniorStyleSheet";
import * as path from "path";
import * as fs from "fs";
import generateContext from "./generateContext";
import { walkFiles } from "./utils";
import { queryData } from "../schemas/query";
import { LLM } from "../schemas/LLM";
import { createLLMFromEnv, LLM } from "../schemas/LLM";
import acquireRepo from "../parse/acquireRepo";
import validatePrLink from "../parse/validatePr";
import { fetchDiffFiles } from "../parse/fetchDiffFiles";

/**
 * Run all graders (criteria, tests, senior style-sheet) and return the
 * combined GradeReport.
 */

interface GradeByAllInput {
  queries: queryData[];
  student_github_link: string;
  github_token?: string; // optional override; else read from env
  repoDestination?: string; // optional path to clone repo (default ./repo)
}

interface GradeByAllOutput {
  gradeReport: GradeReport;
}

export async function gradeByAll(
  request: GradeByAllInput
): Promise<GradeByAllOutput> {
  const {
    student_github_link,
    queries,
    github_token = process.env.GITHUB_TOKEN,
    repoDestination = "./repo",
  } = request;
  // ————————————————————————————————————————————
  // 0. Initialise optional LLM client (may be undefined)
  // ————————————————————————————————————————————
  let llmClient: LLM | undefined;
  try {
    llmClient = createLLMFromEnv();
  } catch {
    console.warn(
      "[gradeByAll] GEMINI_API_KEY not set – proceeding without LLM"
    );
  }

  // Validate the GitHub PR URL
  const validate = validatePrLink({ url: student_github_link });
  if (
    !validate.ok ||
    !validate.cloneUrl ||
    !validate.owner ||
    !validate.repo ||
    !validate.prNumber
  ) {
    throw new Error(`Invalid GitHub PR URL provided: ${student_github_link}`);
  }

  // Clone / pull the student's repository
  const { repoRoot, error: repoError } = acquireRepo({
    cloneUrl: validate.cloneUrl,
    destination: repoDestination,
  });

  if (!repoRoot || repoError) {
    throw new Error(
      `[gradeByAll] Failed to acquire student repository: ${
        repoError || "unknown error"
      }`
    );
  }

  // Fetch diff files for the PR via GitHub API
  let diffFiles = [] as import("../schemas/analysis").DiffFile[];
  if (github_token) {
    try {
      const { diffFiles: fetched, error } = await fetchDiffFiles({
        owner: validate.owner,
        repo: validate.repo,
        prNumber: validate.prNumber,
        githubToken: github_token,
      });
      if (error) {
        console.warn(`[gradeByAll] Failed to fetch diff files: ${error}`);
      } else {
        diffFiles = fetched;
      }
    } catch (err) {
      console.warn(`[gradeByAll] Exception while fetching diff files: ${err}`);
    }
  } else {
    console.warn("[gradeByAll] GITHUB_TOKEN not set – diffFiles will be empty");
  }

  // Generate senior context for this PR / repo
  const seniorContext: SeniorContext = generateContext({ diffFiles, repoRoot });

  // ————————————————————————————————————————————
  // 1. Load SeniorContext & SeniorStyleSheet from criteria folder (fallbacks)
  // ————————————————————————————————————————————
  const criteriaDir = path.resolve(process.cwd(), "criteria");

  const styleSheetPath = path.join(criteriaDir, "stylesheet.json");

  let styleSheetJson: SeniorStyleSheet | undefined;
  if (fs.existsSync(styleSheetPath)) {
    styleSheetJson = JSON.parse(fs.readFileSync(styleSheetPath, "utf8"));
  }

  // ————————————————————————————————————————————
  // 2. Collect test files from the cloned repo's tests folder
  //    These will be copied into the fresh student repo by gradeByTests
  // ————————————————————————————————————————————
  const testsDir = path.join(repoRoot, "tests");

  let testsRepoFiles: RepoFile[] = [];
  if (fs.existsSync(testsDir)) {
    const testExts = new Set<string>([".js", ".jsx", ".ts", ".tsx"]);
    const absPaths = walkFiles(testsDir, testExts);
    testsRepoFiles = absPaths.map((abs) => {
      const rel = path.relative(testsDir, abs).split(path.sep).join("/");
      const ext = path.extname(abs).toLowerCase();
      const language =
        ext === ".ts" || ext === ".tsx" ? "TypeScript" : "JavaScript";
      return {
        path: rel,
        content: fs.readFileSync(abs, "utf8"),
        language,
      } as RepoFile;
    });
  }

  // ————————————————————————————————————————————
  // 3. Run the individual graders
  // ————————————————————————————————————————————

  // okay, when we hit this function, we're just going to
  // 1. load in a) seniorContext, b) senior StyleSheet from criteria folder in root. grade by that
  // 2. we're going to repull their repo to a new folder, then copy the tests folder from original repo to that repo
  // 3. run that repo for tests results. grade by that
  // 4. return all answers
  const byUserCriteria = await gradeByCriteria({
    context: seniorContext,
    criteria: queries,
    llmClient,
  });

  const bySeniorCriteria = styleSheetJson
    ? await gradeBySeniorStyleSheet({
        context: seniorContext,
        seniorStyleSheet: styleSheetJson,
        llmClient,
      })
    : [];

  const byTests = await gradeByTests({
    context: seniorContext,
    tests: testsRepoFiles,
    repoRoot,
  });

  // 5. Combine results
  const gradeReport: GradeReport = {
    byUserCriteria,
    bySeniorCriteria,
    byTests,
  } as any;

  return { gradeReport };
}
