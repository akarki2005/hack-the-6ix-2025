import { RepoFile, SeniorContext } from "../schemas/analysis";
import { LLM } from "../schemas/LLM";
import { generate, guessTestExtension, stripCodeFences } from "./utils";
import * as fs from "fs";
import * as path from "path";

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
}

export async function generateTests(
  props: GenerateTestsInput
): Promise<GenerateTestsOutput> {
  const {
    context,
    dryRun = false,
    testDir = "./repo/tests",
    llmClient,
  } = props;
  fs.mkdirSync(path.resolve(testDir), { recursive: true });

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
      const prompt = `Write a Jest test file for the following code. Return only the code block—no explanations or commentary. Return only the raw code—no markdown fences or formatting..
       Focus on exported functions.\n\nFile: ${file.path}\n${file.content.slice(
        0,
        500
      )}`;
      testContent = await generate(llmClient.ai, prompt);
      testContent = stripCodeFences(testContent);
    } else {
      testContent = `import { ${functions.join(
        ", "
      )} } from '../${file.path.replace(/\.[^.]+$/, "")}';\n\ndescribe('${
        file.path
      }', () => {\n  it('should work', () => {\n    // TODO: add assertions\n  });\n});`;
    }
    const baseName = path.basename(file.path, path.extname(file.path));
    const testFile: RepoFile = {
      path: `${baseName}.test.${guessTestExtension(testContent, file.path)}`,
      content: testContent,
      language: "TypeScript",
    };
    proposedTests.push(testFile);
    rationale += `Proposed test for ${file.path}. `;
    // Optionally write to disk
    console.error("test generated");
    if (!dryRun && testDir) {
      const outPath = path.join(testDir, testFile.path);
      console.error(outPath);
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
