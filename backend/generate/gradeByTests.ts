import { RepoFile, SeniorContext, TestResult } from "../schemas/analysis";

interface GradeByTestsInput {
  context: SeniorContext;
  tests: RepoFile[];
  repoRoot: string;
}

export async function gradeByTests(
  { context, tests, repoRoot }: GradeByTestsInput
): Promise<TestResult> {
  if (!tests?.length) return { total: 0, passed: 0, failed: 0 };

  //validate tests
  const total = tests?.length ?? 0;

  return { total, passed: 0, failed: 0, durationMs: 0, failedTests: [] };
}
