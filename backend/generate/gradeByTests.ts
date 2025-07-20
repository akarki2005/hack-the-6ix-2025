import { RepoFile, SeniorContext, TestResults } from "../schemas/analysis";
import validateTests from "./validateTests";

interface GradeByTestsInput {
  context: SeniorContext;
  tests: RepoFile[];
  repoRoot: string;
  testDir?: string;
}

export async function gradeByTests(
  { context, tests, repoRoot, testDir = "./repo/tests" }: GradeByTestsInput
): Promise<TestResults> {
  if (!tests?.length) return { total: 0, passed: 0, failed: 0 };

  const { result } = await validateTests({
    testFiles: tests,
    testDir,
    repoRoot,
  });

  // Map/return only the required fields for TestResult
  return result;
}
