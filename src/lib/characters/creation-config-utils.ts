import type {
  CreationConfig,
  CreationConfigPublishPayload,
  CreationOption,
  CreationOptionInput,
  CreationStep,
  CreationStepInput,
} from "@/types/character-creation-config";

export const CREATION_BUILDER_DRAFT_KEY = "lucy-creation-builder-draft";

export function getEnabledSteps(config: CreationConfig): CreationStep[] {
  return config.steps.filter((s) => s.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getStepByKey(config: CreationConfig, stepKey: string): CreationStep | undefined {
  return config.steps.find((s) => s.stepKey === stepKey);
}

export function getEnabledOptions(step: CreationStep, group?: string | null): CreationOption[] {
  return step.options
    .filter((o) => o.isEnabled && (group == null || o.optionGroup === group))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export type WizardAppearanceOption = { id: string; label: string; image: string | null };

export function optionsToAppearanceList(
  step: CreationStep,
  group?: string | null,
  style?: string | null,
): WizardAppearanceOption[] {
  let options = getEnabledOptions(step, group);

  if (step.stepKey !== "style") {
    if (style === "anime") {
      options = options.filter((o) => !!o.metadata?.imageUrlAnime);
    } else if (style === "realistic") {
      options = options.filter((o) => !!o.imageUrl);
    }
  }

  return options.map((o) => {
    const isAnime = style === "anime";
    const image = isAnime ? (o.metadata?.imageUrlAnime || o.imageUrl) : o.imageUrl;
    return {
      id: o.optionKey,
      label: o.label,
      image,
    };
  });
}

export function labelFromConfig(
  config: CreationConfig,
  stepKey: string,
  optionKey: string | undefined,
  group?: string | null,
): string | undefined {
  if (!optionKey) return undefined;
  const step = getStepByKey(config, stepKey);
  if (!step) return optionKey;
  const match = step.options.find(
    (o) => o.optionKey === optionKey && (group == null || o.optionGroup === group),
  );
  return match?.label ?? optionKey;
}

export function isValidOptionKey(
  config: CreationConfig,
  stepKey: string,
  optionKey: string,
  group?: string | null,
): boolean {
  const step = getStepByKey(config, stepKey);
  if (!step || !step.isEnabled) return false;
  return step.options.some(
    (o) =>
      o.isEnabled &&
      o.optionKey === optionKey &&
      (group == null || o.optionGroup === group),
  );
}

export function configsEqual(a: CreationConfig, b: CreationConfig): boolean {
  return JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));
}

function normalizeForCompare(config: CreationConfig) {
  return {
    steps: [...config.steps]
      .sort((x, y) => x.sortOrder - y.sortOrder)
      .map((s) => ({
        stepKey: s.stepKey,
        label: s.label,
        description: s.description,
        stepType: s.stepType,
        sortOrder: s.sortOrder,
        isEnabled: s.isEnabled,
        isRequired: s.isRequired,
        config: s.config,
        options: [...s.options]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((o) => ({
            optionKey: o.optionKey,
            optionGroup: o.optionGroup,
            label: o.label,
            imageUrl: o.imageUrl,
            sortOrder: o.sortOrder,
            isEnabled: o.isEnabled,
            metadata: o.metadata,
          })),
      })),
  };
}

export function configFromPublishPayload(payload: CreationConfigPublishPayload): CreationConfig {
  return {
    steps: payload.steps.map((s, si) => ({
      id: s.id ?? `temp-step-${si}`,
      stepKey: s.stepKey,
      label: s.label,
      description: s.description ?? null,
      stepType: s.stepType,
      sortOrder: s.sortOrder,
      isEnabled: s.isEnabled,
      isRequired: s.isRequired,
      config: s.config ?? {},
      options: s.options.map((o, oi) => ({
        id: o.id ?? `temp-opt-${si}-${oi}`,
        stepId: s.id ?? `temp-step-${si}`,
        optionKey: o.optionKey,
        optionGroup: o.optionGroup ?? null,
        label: o.label,
        imageUrl: o.imageUrl ?? null,
        sortOrder: o.sortOrder,
        isEnabled: o.isEnabled,
        metadata: o.metadata ?? {},
      })),
    })),
  };
}

function isTempId(id: string): boolean {
  return id.startsWith("temp-");
}

export function configToPublishPayload(config: CreationConfig): CreationConfigPublishPayload {
  return {
    steps: [...config.steps]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        id: isTempId(s.id) ? undefined : s.id,
        stepKey: s.stepKey,
        label: s.label,
        description: s.description,
        stepType: s.stepType,
        sortOrder: s.sortOrder,
        isEnabled: s.isEnabled,
        isRequired: s.isRequired,
        config: s.config,
        options: [...s.options]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((o) => ({
            id: isTempId(o.id) ? undefined : o.id,
            optionKey: o.optionKey,
            optionGroup: o.optionGroup,
            label: o.label,
            imageUrl: o.imageUrl,
            sortOrder: o.sortOrder,
            isEnabled: o.isEnabled,
            metadata: o.metadata,
          })),
      })),
  };
}

export type { CreationStepInput, CreationOptionInput };
