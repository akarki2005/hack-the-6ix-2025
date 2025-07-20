import { RepoFile, SeniorContext, TestResults } from "../schemas/analysis";
import validateTests from "./validateTests";
import * as path from "path";

interface GradeByTestsInput {
  context: SeniorContext;
  tests: RepoFile[];
  repoRoot: string; // Student repository root (destination)
}

export async function gradeByTests({
  tests,
  repoRoot,
}: GradeByTestsInput): Promise<TestResults> {
  // If no tests were provided, short-circuit with zeros
  if (!tests?.length) {
    return { total: 0, passed: 0, failed: 0 };
  }

  // —— Run Jest on those tests ——
  const testDir = path.join(repoRoot, "tests");

  const { result } = await validateTests({
    testFiles: tests,
    testDir,
    repoRoot,
  });

  return result;
}
