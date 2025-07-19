import { DiffFile, GradeReport, RepoFile } from "../schemas/analysis";

import { gradeByCriteria } from "./gradeByCriteria";
import { gradeByTests } from "./gradeByTests";
import { gradeBySeniorStyleSheet } from "./gradeBySeniorStyleSheet";
import * as path from "path";
import * as fs from "fs";
import generateContext from "./generateContext";
import { queryData } from "../schemas/query";
import { LLM } from "../schemas/LLM";

/**
 * Black-box helper – replace with real implementation that fetches the
 * list of diff files for the pull-request referenced by `githubLink`.
 */
async function getDiffFilesFromPR(githubLink: string): Promise<DiffFile[]> {
  // TODO: fetch the PR, compute the diff and return it as DiffFile[]
  return [];
}

/**
 * Run all graders (criteria, tests, senior style-sheet) and return the
 * combined GradeReport.
 */

interface GradeByAllInput {
  github_link: string;
  newRepoRoot: string;
  llmClient: LLM;
  queries: queryData[];
}

interface GradeByAllOutput {
  gradeReport: GradeReport;
}

export async function gradeByAll(
  request: GradeByAllInput
): Promise<GradeByAllOutput> {
  const { github_link, queries, newRepoRoot, llmClient } = request;

  // 1. Fetch raw diff information for the pull-request
  const diffFiles = await getDiffFilesFromPR(github_link);

  // 2. Build a SeniorContext (typed the same way as in generateContext.ts)
  //    For now we only need diffFiles – the other fields will be loaded from
  //    cached JSON files generated earlier by pipeline stages.
  const seniorContext = generateContext({ diffFiles, newRepoRoot });

  // 3. Load cached artefacts produced by earlier stages of the pipeline
  const contextDir = path.join(__dirname, "../context");
  const testsPath = path.join(contextDir, "tests.json");
  const styleSheetPath = path.join(contextDir, "seniorStyleSheet.json");

  const testsJson = fs.existsSync(testsPath)
    ? (JSON.parse(fs.readFileSync(testsPath, "utf8")) as unknown)
    : undefined;
  const styleSheetJson = fs.existsSync(styleSheetPath)
    ? (JSON.parse(fs.readFileSync(styleSheetPath, "utf8")) as unknown)
    : undefined;

  // Convert testsJson to testsRepoFiles
  const testsRepoFiles: RepoFile[] = testsJson
    ? (Array.isArray(testsJson) ? testsJson : [testsJson]).map((test: any) => ({
        path: test.path || '',
        content: test.content || '',
        language: test.language,
      }))
    : [];

  // 4. Delegate to individual graders
  const byUserCriteria = await gradeByCriteria({
    context: seniorContext,
    criteria: queries,
    llmClient,
  } as any);

  const byTests = await gradeByTests({
    context: seniorContext,
    tests: testsRepoFiles,
    repoRoot: newRepoRoot,
  });

  const bySeniorCriteria = await gradeBySeniorStyleSheet({
    context: seniorContext,
    seniorStyleSheet: styleSheetJson,
    llmClient,
  } as any);

  // 5. Combine results
  const gradeReport: GradeReport = {
    byUserCriteria,
    bySeniorCriteria,
    byTests,
  } as any;

  return { gradeReport };
}
