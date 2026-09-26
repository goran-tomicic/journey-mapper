import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MergedJourneySchema, type MergedJourney, type Extraction } from "./types.js";

const client = new Anthropic();
const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-5";

const SYSTEM_PROMPT = `You merge per-transcript customer journey extractions into a single structured journey map.

Input is a JSON object mapping transcript id to that transcript's extracted steps.

Combine steps that describe the same underlying stage of the journey into one merged step, even if
worded differently across transcripts or if the emotion/quote/pain_point differs. For each merged step:
- step: a short name for the stage, generalized across sources
- emotion: the representative emotion; if sources disagree, pick the emotion of the majority, or the
  more negative one on a tie (frustration is more actionable to surface than delight)
- quote: one representative verbatim quote (pick the clearest one; do not blend quotes from different sources)
- pain_point / opportunity: merged description covering what sources raised
- sources: the transcript ids that describe this step
- disagreement: null if sources agree on emotion/pain point for this step; otherwise a short note
  describing what differs between sources and do NOT silently pick one side

Keep steps in journey order.`;

export async function mergeJourneys(
  extractions: Record<string, Extraction>,
): Promise<MergedJourney> {
  if (Object.keys(extractions).length === 1) {
    const [[id, extraction]] = Object.entries(extractions);
    return {
      steps: extraction.steps.map((step) => ({
        ...step,
        sources: [id],
        disagreement: null,
      })),
    };
  }

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(extractions, null, 2) }],
    output_config: {
      format: zodOutputFormat(MergedJourneySchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Failed to parse merged journey output");
  }

  return response.parsed_output;
}
