import { SeniorContext, CriterionScore } from "../schemas/analysis";
import { queryData } from "../schemas/query";
import { LLM } from "../schemas/LLM";
import { generate } from "./utils";

export interface GradeByCriteriaInput {
  context: SeniorContext;
  criteria: queryData[];
  llmClient?: LLM;
}

export interface GradeByCriteriaOutput {
  scores: CriterionScore[];
}

// Helper ─ strips markdown fences / prose and returns the first valid JSON array
function safeParseJsonArray(raw: string): any[] | null {
  if (!raw) return null;

  // 1⃣ quick attempt – maybe it’s already valid JSON
  try {
    const direct = JSON.parse(raw);
    if (Array.isArray(direct)) return direct;
  } catch {
    /* ignore – we’ll try a more tolerant strategy */
  }

  // 2⃣ remove common code-fence markers
  let cleaned = raw.trim()
    .replace(/```json/gi, "```")   // ```json → ```
    .replace(/```/g, "");

  // 3⃣ take everything between the **first** ‘[’ and the **last** ‘]’
  const start = cleaned.indexOf("[");
  const end   = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
    try {
      const arr = JSON.parse(cleaned);
      return Array.isArray(arr) ? arr : null;
    } catch {
      /* fall through */
    }
  }

  return null; // still couldn’t parse
}

export async function gradeByCriteria(
  props: GradeByCriteriaInput
): Promise<CriterionScore[]> {
  const { context, criteria, llmClient } = props;

  if (!criteria?.length) {
    return [];
  }

  if (!llmClient || !llmClient.ai) {
    // Return default scores for all criteria if no LLM client
    return criteria.map(criterion => ({
      name: criterion.criteria_label,
      score: 50,
      justification: "No LLM client provided",
      suggestions: ["Manual review required"],
      weight: criterion.importance,
    }));
  }

  try {
    // Build a comprehensive prompt for all criteria
    const criteriaList = criteria.map((criterion, index) => `
${index + 1}. **${criterion.criteria_label}**
   Definition: ${criterion.definition}
   Importance: ${criterion.importance}/10`).join('\n');

    const prompt = `
You are a senior code reviewer evaluating a pull request based on multiple criteria.

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

**Evaluation Criteria:**
${criteriaList}

**Instructions:**
1. Evaluate the code changes against ALL criteria listed above
2. For each criterion, provide a score from 0-100 (where 100 is perfect adherence)
3. Give a clear justification explaining your score for each criterion
4. Suggest 2-3 specific improvements if the score is below 90

Respond with a JSON array containing one object for each criterion in the exact format:
[
  {
    "name": "criterion_name_1",
    "score": <number 0-100>,
    "justification": "<detailed explanation>",
    "suggestions": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
  },
  {
    "name": "criterion_name_2",
    "score": <number 0-100>,
    "justification": "<detailed explanation>",
    "suggestions": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
  }
]
`;

    const response = await generate(llmClient.ai, prompt);

    // Try to parse the JSON array response
    const parsed = safeParseJsonArray(response);
    if (!parsed) {
      throw new Error("Unable to extract JSON array from LLM response");
    }

    // Map the parsed response to CriterionScore format
    const scores: CriterionScore[] = criteria.map((criterion, index) => {
      const result =
        parsed.find(p => p.name === criterion.criteria_label) || parsed[index];

      return {
        name: criterion.criteria_label,
        score: Math.max(0, Math.min(100, result?.score ?? 50)),
        justification: result?.justification ?? "No justification provided",
        suggestions: Array.isArray(result?.suggestions) ? result.suggestions : [],
        weight: criterion.importance,
      };
    });

    return scores;
  } catch (error) {
    // Fallback for LLM errors - return default scores for all criteria
    return criteria.map(criterion => ({
      name: criterion.criteria_label,
      score: 50,
      justification: `Error evaluating criteria: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestions: ["Manual review required due to evaluation error"],
      weight: criterion.importance,
    }));
  }
}
