interface GenerateTestsInput {
  seniorContext: SeniorContext;
  prPurpose: string; // human sentence describing feature intent
  styleSheet?: SeniorStyleSheet; // optional to align patterns
  dryRun?: boolean; // if true, do not write to disk
  testDir?: string;
  llmClient?: LLM; // abstraction for model call
}

interface GenerateTestsOutput {
  proposedTests: RepoFile[]; // path + content (not yet committed)
  rationale: string;
  coverageTargets?: string[]; // e.g. functions/modules it aims to exercise
  executed?: TestResult; // if run
}

export function generateTests(props: GenerateTestsInput): GenerateTestsOutput {}
