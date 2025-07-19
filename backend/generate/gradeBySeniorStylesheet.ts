import { SeniorContext, CriterionScore, SeniorStyleSheet } from "../schemas/analysis";
import { LLM } from "../schemas/LLM";
import { generate } from "./utils";

export interface GradeBySeniorStyleSheetInput {
  context: SeniorContext;
  seniorStyleSheet: SeniorStyleSheet;
  llmClient?: LLM;
}

export async function gradeBySeniorStyleSheet(
  props: GradeBySeniorStyleSheetInput
): Promise<CriterionScore[]> {
  const { context, seniorStyleSheet, llmClient } = props;

  if (!seniorStyleSheet) {
    return [];
  }

  // Define the senior-level criteria to evaluate
  const seniorCriteria = [
    {
      name: "Layering Architecture",
      description: seniorStyleSheet.layering,
      weight: 10
    },
    {
      name: "Input Validation",
      description: seniorStyleSheet.validation,
      weight: 10
    },
    {
      name: "Error Handling",
      description: seniorStyleSheet.errorHandling,
      weight: 10
    },
    {
      name: "Naming Conventions",
      description: seniorStyleSheet.naming,
      weight: 10
    },
    {
      name: "Code Modularity",
      description: `Max function LOC: ${seniorStyleSheet.modularity.maxFunctionLoc}. ${seniorStyleSheet.modularity.duplicationRule}`,
      weight: 10
    },
    {
      name: "Testing Standards",
      description: seniorStyleSheet.testing,
      weight: 10
    },
    {
      name: "Logging Practices",
      description: seniorStyleSheet.logging,
      weight: 10
    },
    {
      name: "Security Measures",
      description: seniorStyleSheet.security,
      weight: 10
    },
    {
      name: "API Contract Design",
      description: seniorStyleSheet.apiContract,
      weight: 10
    }
  ];

  if (!llmClient || !llmClient.ai) {
    // Return default scores for all criteria if no LLM client
    return seniorCriteria.map(criterion => ({
      name: criterion.name,
      score: 50,
      justification: "No LLM client provided",
      suggestions: ["Manual review required"],
      weight: criterion.weight,
    }));
  }

  try {
    // Build a comprehensive prompt for all criteria
    const criteriaList = seniorCriteria.map((criterion, index) => `
${index + 1}. **${criterion.name}**
   Standards: ${criterion.description}
   Weight: ${criterion.weight}/10`).join('\n');

    const prompt = `
You are a senior software architect evaluating a pull request against established senior-level coding standards.

**Code Context:**
Tech Stack: ${JSON.stringify(context.techStack, null, 2)}

**Changed Files:**
${context.diffFiles.map(f => `- ${f.path} (${f.status}): +${f.additions} -${f.deletions}`).join('\n')}

**Related Code Files:**
${context.relatedFiles.slice(0, 3).map(f => `
File: ${f.path}
\`\`\`
${f.content.slice(0, 800)}
\`\`\`
`).join('\n')}

**Exemplar Code Examples:**
${seniorStyleSheet.exemplars ? Object.entries(seniorStyleSheet.exemplars).slice(0, 2).map(([key, example]) => `
${key}: ${example?.path || 'N/A'}
\`\`\`
${example?.content?.slice(0, 400) || 'No content'}
\`\`\`
`).join('\n') : 'No exemplars provided'}

**Quantitative Metrics:**
- Average Function LOC: ${seniorStyleSheet.quantitative?.avgFunctionLoc || 'N/A'}
- Tests Added: ${seniorStyleSheet.quantitative?.testsAdded || 'N/A'}
- Error Helper Usage: ${seniorStyleSheet.quantitative?.errorHelperUsage || 'N/A'}
- Validation Coverage: ${seniorStyleSheet.quantitative?.validationCoveragePct || 'N/A'}%

**Senior-Level Evaluation Criteria:**
${criteriaList}

**Instructions:**
1. Evaluate the code changes against ALL senior-level standards listed above
2. Compare against the provided exemplar code and quantitative metrics
3. For each criterion, provide a score from 0-100 (where 100 is exceptional senior-level code quality)
4. Give detailed justification with specific code references for each criterion
5. Suggest concrete improvements that align with senior engineering practices

Respond with a JSON array containing one object for each criterion in the exact format:
[
  {
    "name": "criterion_name_1",
    "score": <number 0-100>,
    "justification": "<detailed explanation with specific code references>",
    "suggestions": ["<specific senior-level improvement 1>", "<specific senior-level improvement 2>", "<specific senior-level improvement 3>"]
  },
  {
    "name": "criterion_name_2",
    "score": <number 0-100>,
    "justification": "<detailed explanation with specific code references>",
    "suggestions": ["<specific senior-level improvement 1>", "<specific senior-level improvement 2>", "<specific senior-level improvement 3>"]
  }
]
`;

    const response = await generate(llmClient.ai, prompt);

    // Try to parse the JSON array response
    try {
      const parsed = JSON.parse(response);
      if (!Array.isArray(parsed)) {
        throw new Error("Response is not an array");
      }

      // Map the parsed response to CriterionScore format
      const scores: CriterionScore[] = seniorCriteria.map((criterion, index) => {
        const result = parsed.find(p => p.name === criterion.name) || parsed[index];

        return {
          name: criterion.name,
          score: Math.max(0, Math.min(100, result?.score || 60)),
          justification: result?.justification || "No justification provided",
          suggestions: Array.isArray(result?.suggestions) ? result.suggestions : [],
          weight: criterion.weight,
        };
      });

      return scores;
    } catch (parseError) {
      // Fallback if JSON parsing fails - return default scores
      return seniorCriteria.map(criterion => ({
        name: criterion.name,
        score: 70,
        justification: `LLM response could not be parsed: ${response.slice(0, 200)}...`,
        suggestions: ["Manual senior-level review required for this criterion"],
        weight: criterion.weight,
      }));
    }
  } catch (error) {
    // Fallback for LLM errors - return default scores for all criteria
    return seniorCriteria.map(criterion => ({
      name: criterion.name,
      score: 60,
      justification: `Error evaluating senior criteria: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestions: ["Senior-level manual review required due to evaluation error"],
      weight: criterion.weight,
    }));
  }
}
