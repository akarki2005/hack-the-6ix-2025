import { RepoFile, SeniorContext, TestResult } from "../schemas/analysis";
import validateTests from "./validateTests";

interface GradeByTestsInput {
  context: SeniorContext;
  tests: RepoFile[];
  repoRoot: string;
}

export async function gradeByTests(
  { context, tests, repoRoot }: GradeByTestsInput
): Promise<TestResult> {
  if (!tests?.length) return { total: 0, passed: 0, failed: 0 };

  const { result } = await validateTests({
    testFiles: tests,
  });

  // Map/return only the required fields for TestResult
  return result;
}
