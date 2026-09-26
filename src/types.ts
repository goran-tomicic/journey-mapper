import { z } from "zod";

export const EmotionSchema = z.enum(["frustrated", "neutral", "delighted"]);

export const JourneyStepSchema = z.object({
  step: z.string().describe("Short name for this stage of the journey"),
  emotion: EmotionSchema,
  quote: z.string().describe("Verbatim supporting quote from the transcript"),
  pain_point: z.string().describe("The friction or problem at this step, empty string if none"),
  opportunity: z.string().describe("A suggested improvement at this step, empty string if none"),
});

export const ExtractionSchema = z.object({
  steps: z.array(JourneyStepSchema),
});

export type JourneyStep = z.infer<typeof JourneyStepSchema>;
export type Extraction = z.infer<typeof ExtractionSchema>;

export const MergedStepSchema = JourneyStepSchema.extend({
  sources: z.array(z.string()).describe("Transcript ids that describe this step"),
  disagreement: z
    .string()
    .nullable()
    .describe("Note describing how sources disagreed on this step, or null if they agreed"),
});

export const MergedJourneySchema = z.object({
  steps: z.array(MergedStepSchema),
});

export type MergedStep = z.infer<typeof MergedStepSchema>;
export type MergedJourney = z.infer<typeof MergedJourneySchema>;

export interface TranscriptSource {
  id: string;
  text: string;
}
