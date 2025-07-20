import { RepoFile, SeniorContext, TestResults } from "../schemas/analysis";
import validateTests from "./validateTests";
import { copyTestsFolder } from "./utils";
import * as fs from "fs";
import * as path from "path";

interface GradeByTestsInput {
  context: SeniorContext;
  tests: RepoFile[];
  repoRoot: string; // Student repository root (destination)
  sourceRepoRoot?: string; // Where the generated tests currently live (defaults to "./repo")
}

export async function gradeByTests({
  context,
  tests,
  repoRoot,
  sourceRepoRoot = "./repo",
}: GradeByTestsInput): Promise<TestResults> {
  // If no tests were provided, short-circuit with zeros
  if (!tests?.length) {
    return { total: 0, passed: 0, failed: 0 };
  }

  // —— 1. Copy tests into the student's repo  ——
  try {
    const srcTestsDir = path.join(sourceRepoRoot, "tests");
    if (fs.existsSync(srcTestsDir)) {
      copyTestsFolder(sourceRepoRoot, repoRoot);
    } else {
      console.warn(
        `[gradeByTests] Source tests folder not found at ${srcTestsDir}. Skipping copy.`
      );
    }
  } catch (err) {
    console.warn("[gradeByTests] Failed to copy tests folder:", err);
  }

  // —— 2. Run Jest on those tests (written again so we guarantee latest code) ——
  const testDir = path.join(repoRoot, "tests");

  const { result } = await validateTests({
    testFiles: tests,
    testDir,
    repoRoot,
  });

  return result;
}
