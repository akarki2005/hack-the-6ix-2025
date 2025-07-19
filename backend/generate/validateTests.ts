// input (test location)

import { RepoFile, TestResult } from "../schemas/analysis";
import * as fs from "fs";
import * as path from "path";
import { runCLI } from "jest";

interface ValidateTestsInput {
  testFiles: RepoFile[];
  testDir?: string;
}

interface ValidateTestsOutput {
  result: TestResult;
}

async function runJestAndParse(testDir: string): Promise<TestResult> {
  const testFilesInDir = fs
    .readdirSync(testDir)
    .filter((f) => f.endsWith(".test.js"))
    .map((f) => path.join(testDir, f));

  const cliArgv = {
    _: testFilesInDir,
    runInBand: true,
    json: false,
    noCache: true,
    silent: true,
    $0: "jest",
  };

  try {
    const cliResult = await runCLI(cliArgv, [process.cwd()]);
    const results = cliResult.results;
    console.log("results", results);
    let total = 0,
      passed = 0,
      failed = 0,
      failedTests: { name: string; message: string }[] = [];
    for (const suite of results.testResults || []) {
      for (const assertion of (suite as any).testResults || []) {
        total++;
        if (assertion.status === "passed") passed++;
        else if (assertion.status === "failed") {
          failed++;
          failedTests.push({
            name: assertion.fullName || assertion.title,
            message: (assertion.failureMessages || []).join("\n"),
          });
        }
      }
    }
    return {
      total,
      passed,
      failed,
      durationMs: undefined, // Jest's AggregatedResult does not have endTime
      failedTests: failedTests.length ? failedTests : undefined,
    };
  } catch (e) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      durationMs: 0,
      failedTests: [{ name: "Jest runCLI error", message: String(e) }],
    };
  }
}

export default async function validateTests(
  props: ValidateTestsInput
): Promise<ValidateTestsOutput> {
  const { testFiles } = props;
  const runDir = path.join(__dirname, "tests", "tmp-validate");
  if (fs.existsSync(runDir)) {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
  fs.mkdirSync(runDir, { recursive: true });
  console.log("[validateTests] Writing test files to:", runDir);
  for (const file of testFiles) {
    const outPath = path.join(runDir, file.path);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, file.content, "utf8");
    console.log(
      "[validateTests] Wrote file:",
      outPath,
      "Exists:",
      fs.existsSync(outPath)
    );
  }
  try {
    const files = fs.readdirSync(runDir);
    console.log("[validateTests] Directory contents:", files);
  } catch (e) {
    console.log("[validateTests] Could not read directory contents:", e);
  }

  const result = await runJestAndParse(runDir);

  return { result };
}
