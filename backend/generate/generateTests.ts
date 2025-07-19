import { RepoFile, SeniorContext, TestResult } from "../schemas/analysis";
import { LLM } from "../schemas/LLM";
import { generate } from "./utils";

interface GenerateTestsInput {
  context: SeniorContext;
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

export async function generateTests(
  props: GenerateTestsInput
): Promise<GenerateTestsOutput> {
  const { context, dryRun = true, testDir, llmClient } = props;
  const changedFiles = context.diffFiles.map((f) => f.path);
  const relatedFiles = context.relatedFiles.filter((f) =>
    changedFiles.includes(f.path)
  );
  const proposedTests: RepoFile[] = [];
  const coverageTargets: string[] = [];
  let rationale = "";

  // Helper: is this a test file?
  function isTestFile(file: RepoFile): boolean {
    return /test|spec/i.test(file.path) || /describe\s*\(/.test(file.content);
  }

  // Helper: extract exported function names (simple regex)
  function getExportedFunctions(content: string): string[] {
    const exportFuncRegex = /export\s+function\s+(\w+)/g;
    const names: string[] = [];
    let match;
    while ((match = exportFuncRegex.exec(content))) {
      names.push(match[1]);
    }
    return names;
  }

  for (const file of relatedFiles) {
    if (isTestFile(file)) continue; // skip test files
    const functions = getExportedFunctions(file.content);
    coverageTargets.push(...(functions.length ? functions : [file.path]));
    // Generate test content
    let testContent = "";
    if (llmClient && llmClient.ai) {
      const prompt = `Write a Jest test file for the following code. Focus on exported functions.\n\nFile: ${
        file.path
      }\n${file.content.slice(0, 500)}`;
      testContent = await generate(llmClient.ai, prompt);
    } else {
      testContent = `import { ${functions.join(
        ", "
      )} } from '../${file.path.replace(/\.[^.]+$/, "")}';\n\ndescribe('${
        file.path
      }', () => {\n  it('should work', () => {\n    // TODO: add assertions\n  });\n});`;
    }
    const testFile: RepoFile = {
      path: file.path.replace(/\.[^.]+$/, ".test.ts"),
      content: testContent,
      language: "TypeScript",
    };
    proposedTests.push(testFile);
    rationale += `Proposed test for ${file.path}. `;
    // Optionally write to disk
    if (!dryRun && testDir) {
      const fs = require("fs");
      const path = require("path");
      const outPath = path.join(testDir, testFile.path);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, testFile.content, "utf8");
    }
  }

  return {
    proposedTests,
    rationale: rationale.trim(),
    coverageTargets: Array.from(new Set(coverageTargets)),
  };
}
