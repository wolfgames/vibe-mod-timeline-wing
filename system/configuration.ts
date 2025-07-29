import { z } from "zod"
import { baseConfig, BaseActions, ModuleReplayAbility, ModuleResultType, ModuleIntegrationType } from 'wolfy-module-kit';
import { AppActionsSchema } from "./actions";

// region Generated
const moduleConfiguration = z.object({
  resultAction: AppActionsSchema,
  selectedCase: z.enum(["WongTimeline", "midnightOilTimeline2", "beaumontTimeline2"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  maxAttempts: z.number().min(1).max(10),
  showHints: z.boolean(),
  timeLimit: z.number().optional(),
});

/**
 * Form state interface for configuration form
 */
export interface ConfigFormData {
  replayAbility: ModuleReplayAbility;
  expectedResultType: ModuleResultType;
  integrationType: ModuleIntegrationType;
  resultAction: BaseActions;
  selectedCase: "WongTimeline" | "midnightOilTimeline2" | "beaumontTimeline2";
  difficulty: "easy" | "medium" | "hard";
  maxAttempts: number;
  showHints: boolean;
  timeLimit?: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ConfigFormData = {
  replayAbility: ModuleReplayAbility.Once,
  expectedResultType: ModuleResultType.Attempt,
  integrationType: ModuleIntegrationType.Standalone,
  resultAction: BaseActions.Done,
  selectedCase: "WongTimeline",
  difficulty: "medium",
  maxAttempts: 3,
  showHints: true,
}
// endregion Generated

const fullConfig = baseConfig.merge(moduleConfiguration);
export default fullConfig;

export type ModuleConfig = z.infer<typeof fullConfig>;

export const conditionalConfig = fullConfig.partial();
export type ConditionalConfigType = z.infer<typeof conditionalConfig>;
