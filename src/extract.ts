import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ExtractionSchema, type Extraction, type TranscriptSource } from "./types.js";

const client = new Anthropic();
const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-5";

const SYSTEM_PROMPT = `You extract a structured customer journey from a raw interview transcript.

For each distinct step in the journey the interviewee describes, extract:
- step: a short name for that stage
- emotion: one of "frustrated", "neutral", "delighted" reflecting the interviewee's state during that step
- quote: a verbatim quote from the transcript supporting this step
- pain_point: the friction described at this step (empty string if none)
- opportunity: a concrete improvement suggested by the pain point (empty string if none)

Keep steps in the order they occurred in the journey, not the order mentioned in the transcript, when the two differ.`;

export async function extractJourney(transcript: TranscriptSource): Promise<Extraction> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: transcript.text }],
    output_config: {
      format: zodOutputFormat(ExtractionSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error(`Failed to parse extraction output for transcript "${transcript.id}"`);
  }

  return response.parsed_output;
}
