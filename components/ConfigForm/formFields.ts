import { AppActionsSchema } from "@/system/actions"
import { ModuleReplayAbility, ModuleIntegrationType, ModuleResultType } from 'wolfy-module-kit'
import { type FormFieldConfig } from '@/components/ConfigForm/ConfigForm'

export const FORM_FIELDS: FormFieldConfig[] = [
  {
    key: "selectedCase",
    label: "Detective Case",
    type: "select",
    options: ["WongTimeline", "midnightOilTimeline2", "beaumontTimeline2"],
    required: true,
  },
  {
    key: "difficulty",
    label: "Difficulty Level",
    type: "select",
    options: ["easy", "medium", "hard"],
    required: true,
  },
  {
    key: "maxAttempts",
    label: "Maximum Attempts",
    type: "number",
    min: 1,
    max: 10,
    required: true,
  },
  {
    key: "showHints",
    label: "Enable Hints",
    type: "select",
    options: ["true", "false"],
    required: true,
  },
  {
    key: "resultAction",
    label: "Module Result Action",
    type: "select",
    options: [AppActionsSchema.enum.Done, AppActionsSchema.enum.CustomAction],
    required: true,
  },
  {
    key: 'replayAbility',
    label: 'Replay Ability',
    type: 'select',
    options: Object.values(ModuleReplayAbility) as string[],
    required: true,
  },
  {
    key: 'expectedResultType',
    label: 'Expected Result Type',
    type: 'select',
    options: Object.values(ModuleResultType) as string[],
    required: true,
  },
  {
    key: 'integrationType',
    label: 'Integration Type',
    type: 'select',
    options: Object.values(ModuleIntegrationType) as string[],
    required: true,
  },
]