import { RepoFile, TestResults } from "../schemas/analysis";
import * as fs from "fs";
import * as path from "path";

import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

interface RemoveFailingTestsInput {
  tests: RepoFile[];
  testResults: TestResults;
  testDir: string;
}

export default function removeFailingTests({
  tests,
  testResults,
  testDir,
}: RemoveFailingTestsInput): RepoFile[] {
  if (!testResults?.failedTests?.length) return tests;

  const failingNames = testResults.failedTests!.map((t) => t.name);

  return tests.map((file) => {
    // 1) Parse the source, supporting TS & JSX
    const ast = parse(file.content, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    // 2) Traverse and remove matching it/test statements
    traverse(ast, {
      CallExpression(path) {
        // Identify callee: either `it` or `test`, possibly .only/.skip
        let calleeName: string | null = null;
        if (t.isIdentifier(path.node.callee)) {
          calleeName = path.node.callee.name;
        } else if (
          t.isMemberExpression(path.node.callee) &&
          t.isIdentifier(path.node.callee.object)
        ) {
          // handles `it.only` / `test.skip`
          calleeName = path.node.callee.object.name;
        }

        if (calleeName === "it" || calleeName === "test") {
          // First argument should be a string literal
          const firstArg = path.node.arguments[0];
          if (
            t.isStringLiteral(firstArg) &&
            failingNames.includes(firstArg.value)
          ) {
            // Remove the entire statement
            const stmt = path.getStatementParent();
            if (stmt) stmt.remove();
          }
        }
      },
    });

    // 3) Generate the transformed code
    const { code } = generate(ast, {
      /* options to preserve formatting as much as possible */
      retainLines: true,
      decoratorsBeforeExport: true,
    });

    // 4) Write back out
    try {
      const outPath = path.join(testDir, file.path);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, code, "utf8");
    } catch (e) {
      console.warn("[removeFailingTests] Failed to write", file.path, e);
    }

    return { ...file, content: code };
  });
}
