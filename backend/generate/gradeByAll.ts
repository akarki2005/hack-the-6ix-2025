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

  // okay, when we hit this function, we're just going to
  // 1. load in a) seniorContext, b) senior StyleSheet. grade by that
  // 2. we're going to repull their repo to a new folder, then copy the tests folder from original repo to that repo
  // 3. run that repo for tests results. grade by that
  // 4. return all answers
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
