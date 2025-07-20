import { RepoFile, SeniorContext } from "../schemas/analysis";
import { LLM } from "../schemas/LLM";
import { generate as generateAI } from "./utils";

export interface GenerateSeniorStyleSheetInput {
  seniorContext: SeniorContext;
  exemplarSelectors?: {
    routePattern?: RegExp;
    servicePattern?: RegExp;
    testPattern?: RegExp;
    validationPattern?: RegExp;
  };
  llmClient?: LLM;
  maxFunctionLocThreshold?: number;
}

export interface SeniorStyleSheet {
  layering: string;
  validation: string;
  errorHandling: string;
  naming: string;
  modularity: {
    maxFunctionLoc: number;
    duplicationRule: string;
  };
  testing: string;
  logging: string;
  security: string;
  apiContract: string;
  exemplars: {
    route: RepoFile;
    service: RepoFile;
    test: RepoFile;
    validation: RepoFile;
    [k: string]: RepoFile | undefined;
  };
  quantitative: {
    avgFunctionLoc?: number;
    testsAdded?: number;
    errorHelperUsage?: number;
    validationCoveragePct?: number;
  };
  namingExamples?: string[];
  rawSourceMeta?: { prNumber?: number; baseRef?: string; headRef?: string };
}

export async function GenerateSeniorStyleSheet(
  props: GenerateSeniorStyleSheetInput
): Promise<SeniorStyleSheet> {
  const {
    seniorContext,
    exemplarSelectors = {},
    llmClient,
    maxFunctionLocThreshold = 50,
  } = props;
  const { relatedFiles } = seniorContext;

  // Helper: Find all functions in a file (simple regex, JS/TS only)
  function getFunctionLengths(content: string): number[] {
    const functionRegex =
      /function\s+\w+\s*\([^)]*\)\s*{([\s\S]*?)}|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{([\s\S]*?)}|([a-zA-Z0-9_]+)\s*:\s*\([^)]*\)\s*=>\s*{([\s\S]*?)}|([a-zA-Z0-9_]+)\s*\([^)]*\)\s*{([\s\S]*?)};/g;
    const matches = content.matchAll(functionRegex);
    const lengths: number[] = [];
    for (const match of matches) {
      // Count lines in the function body
      const body = match[1] || match[2] || match[4] || match[6] || "";
      if (body) {
        lengths.push(body.split("\n").length);
      }
    }
    return lengths;
  }

  // Helper: Find test files (by path or content)
  function isTestFile(file: RepoFile): boolean {
    return /test|spec/i.test(file.path) || /describe\s*\(/.test(file.content);
  }

  // Helper: Find route files (by content)
  function isRouteFile(file: RepoFile): boolean {
    return /router\.(get|post|put|delete|patch)/.test(file.content);
  }

  // Helper: Find validation files (by content)
  function isValidationFile(file: RepoFile): boolean {
    return /zod|joi|yup|validate/.test(file.content);
  }

  // Helper: Find service files (by content)
  function isServiceFile(file: RepoFile): boolean {
    return (
      /service|usecase|logic/.test(file.path) ||
      /class\s+\w+Service/.test(file.content)
    );
  }

  // Quantitative metrics
  let allFunctionLoc: number[] = [];
  let testsAdded = 0;
  let errorHelperUsage = 0;
  let validationCoverage = 0;
  let validationFiles = 0;

  relatedFiles.forEach((file) => {
    const functionLocs = getFunctionLengths(file.content);
    allFunctionLoc.push(...functionLocs);
    if (isTestFile(file)) testsAdded++;
    if (isValidationFile(file)) {
      validationFiles++;
      if (/validate/.test(file.content)) validationCoverage++;
    }
    if (/errorHelper|handleError/.test(file.content)) errorHelperUsage++;
  });

  const avgFunctionLoc = allFunctionLoc.length
    ? allFunctionLoc.reduce((a, b) => a + b, 0) / allFunctionLoc.length
    : 0;
  const validationCoveragePct = validationFiles
    ? (validationCoverage / validationFiles) * 100
    : 0;

  // Exemplar selection (pick first match or fallback)
  const exemplars = {
    route: relatedFiles.find(isRouteFile) || relatedFiles[0],
    service: relatedFiles.find(isServiceFile) || relatedFiles[0],
    test: relatedFiles.find(isTestFile) || relatedFiles[0],
    validation: relatedFiles.find(isValidationFile) || relatedFiles[0],
  };

  // Naming examples (simple: collect all exported function names)
  const namingExamples: string[] = [];
  relatedFiles.forEach((file) => {
    const exportFuncRegex = /export\s+function\s+(\w+)/g;
    let match;
    while ((match = exportFuncRegex.exec(file.content))) {
      namingExamples.push(match[1]);
    }
  });

  // Style fields (use LLM if provided, else heuristics)
  async function summarize(field: string): Promise<string> {
    if (llmClient && llmClient.ai) {
      // Compose a prompt for the LLM
      const prompt =
        `Summarize the codebase's ${field} style in 2-3 sentences, focusing on best practices and patterns you observe. Use the following code samples as context:\n\n` +
        relatedFiles
          .slice(0, 2)
          .map((f) => `File: ${f.path}\n${f.content.slice(0, 300)}`)
          .join("\n\n");
      try {
        return await generateAI(llmClient.ai, prompt);
      } catch (e) {
        return `LLM error for ${field}`;
      }
    }
    // Heuristic fallback
    switch (field) {
      case "layering":
        return "Uses clear separation of concerns with routes, services, and validation.";
      case "validation":
        return "Validation is performed using schema libraries and explicit checks.";
      case "errorHandling":
        return "Error handling uses helpers and try/catch blocks.";
      case "naming":
        return "Naming follows camelCase for functions and PascalCase for classes.";
      case "testing":
        return "Tests are present for most modules, using describe/it blocks.";
      case "logging":
        return "Logging is performed using console or logger libraries.";
      case "security":
        return "Security checks are present for user input and API endpoints.";
      case "apiContract":
        return "API contracts are defined via route handlers and validation schemas.";
      default:
        return "Standard practice.";
    }
  }

  return {
    layering: await summarize("layering"),
    validation: await summarize("validation"),
    errorHandling: await summarize("errorHandling"),
    naming: await summarize("naming"),
    modularity: {
      maxFunctionLoc: Math.max(...allFunctionLoc, 0),
      duplicationRule: "Avoid duplicate code by extracting helpers.",
    },
    testing: await summarize("testing"),
    logging: await summarize("logging"),
    security: await summarize("security"),
    apiContract: await summarize("apiContract"),
    exemplars,
    quantitative: {
      avgFunctionLoc,
      testsAdded,
      errorHelperUsage,
      validationCoveragePct,
    },
    namingExamples,
    rawSourceMeta: undefined,
  };
}
