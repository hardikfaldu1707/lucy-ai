import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildDefaultCreationConfigPayload } from "@/lib/characters/creation-config-defaults";
import { configFromPublishPayload } from "@/lib/characters/creation-config-utils";
import type {
  CreationConfig,
  CreationConfigPublishPayload,
  CreationOption,
  CreationOptionInput,
  CreationOptionMetadata,
  CreationStep,
  CreationStepConfig,
  CreationStepInput,
  CreationStepType,
} from "@/types/character-creation-config";

type StepRow = {
  id: string;
  step_key: string;
  label: string;
  description: string | null;
  step_type: CreationStepType;
  sort_order: number;
  is_enabled: boolean;
  is_required: boolean;
  config: CreationStepConfig;
};

type OptionRow = {
  id: string;
  step_id: string;
  option_key: string;
  option_group: string | null;
  label: string;
  image_url: string | null;
  sort_order: number;
  is_enabled: boolean;
  metadata: CreationOptionMetadata;
};

function mapStep(row: StepRow, options: CreationOption[]): CreationStep {
  return {
    id: row.id,
    stepKey: row.step_key,
    label: row.label,
    description: row.description,
    stepType: row.step_type,
    sortOrder: row.sort_order,
    isEnabled: row.is_enabled,
    isRequired: row.is_required,
    config: row.config ?? {},
    options,
  };
}

function mapOption(row: OptionRow): CreationOption {
  return {
    id: row.id,
    stepId: row.step_id,
    optionKey: row.option_key,
    optionGroup: row.option_group,
    label: row.label,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isEnabled: row.is_enabled,
    metadata: row.metadata ?? {},
  };
}

async function loadStepsAndOptions(enabledOnly: boolean): Promise<CreationConfig> {
  let stepQuery = supabaseAdmin()
    .from("character_creation_steps")
    .select("*")
    .order("sort_order", { ascending: true });

  if (enabledOnly) {
    stepQuery = stepQuery.eq("is_enabled", true);
  }

  const { data: stepRows, error: stepErr } = await stepQuery;
  if (stepErr) throw new Error(stepErr.message);

  if (!stepRows?.length) {
    return { steps: [] };
  }

  const stepIds = stepRows.map((s) => s.id);
  let optQuery = supabaseAdmin()
    .from("character_creation_options")
    .select("*")
    .in("step_id", stepIds)
    .order("sort_order", { ascending: true });

  if (enabledOnly) {
    optQuery = optQuery.eq("is_enabled", true);
  }

  const { data: optRows, error: optErr } = await optQuery;
  if (optErr) throw new Error(optErr.message);

  const optionsByStep = new Map<string, CreationOption[]>();
  for (const row of (optRows ?? []) as OptionRow[]) {
    const list = optionsByStep.get(row.step_id) ?? [];
    list.push(mapOption(row));
    optionsByStep.set(row.step_id, list);
  }

  const steps = (stepRows as StepRow[]).map((row) =>
    mapStep(row, optionsByStep.get(row.id) ?? []),
  );

  return { steps };
}

async function writeCreationConfig(
  payload: CreationConfigPublishPayload,
): Promise<CreationConfig> {
  const db = supabaseAdmin();
  const existingStepIds = payload.steps.filter((s) => s.id).map((s) => s.id!);

  const { data: allSteps } = await db.from("character_creation_steps").select("id");
  const toDeleteSteps = (allSteps ?? [])
    .map((s) => s.id)
    .filter((id) => !existingStepIds.includes(id));

  if (toDeleteSteps.length) {
    await db.from("character_creation_steps").delete().in("id", toDeleteSteps);
  }

  const stepKeyToId = new Map<string, string>();

  for (const step of payload.steps) {
    const stepData = {
      step_key: step.stepKey,
      label: step.label,
      description: step.description ?? null,
      step_type: step.stepType,
      sort_order: step.sortOrder,
      is_enabled: step.isEnabled,
      is_required: step.isRequired,
      config: step.config ?? {},
      updated_at: new Date().toISOString(),
    };

    if (step.id) {
      const { error } = await db
        .from("character_creation_steps")
        .update(stepData)
        .eq("id", step.id);
      if (error) throw new Error(error.message);
      stepKeyToId.set(step.stepKey, step.id);
    } else {
      const { data, error } = await db
        .from("character_creation_steps")
        .insert(stepData)
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Failed to insert step");
      stepKeyToId.set(step.stepKey, data.id);
    }
  }

  for (const step of payload.steps) {
    const stepId = stepKeyToId.get(step.stepKey);
    if (!stepId) continue;

    const existingOptIds = step.options.filter((o) => o.id).map((o) => o.id!);
    const { data: currentOpts } = await db
      .from("character_creation_options")
      .select("id")
      .eq("step_id", stepId);

    const toDeleteOpts = (currentOpts ?? [])
      .map((o) => o.id)
      .filter((id) => !existingOptIds.includes(id));

    if (toDeleteOpts.length) {
      await db.from("character_creation_options").delete().in("id", toDeleteOpts);
    }

    for (const opt of step.options) {
      const optData = {
        step_id: stepId,
        option_key: opt.optionKey,
        option_group: opt.optionGroup ?? null,
        label: opt.label,
        image_url: opt.imageUrl ?? null,
        sort_order: opt.sortOrder,
        is_enabled: opt.isEnabled,
        metadata: opt.metadata ?? {},
        updated_at: new Date().toISOString(),
      };

      if (opt.id) {
        const { error } = await db
          .from("character_creation_options")
          .update(optData)
          .eq("id", opt.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await db.from("character_creation_options").insert(optData);
        if (error) throw new Error(error.message);
      }
    }
  }

  return loadStepsAndOptions(false);
}

export function revalidateCreationConfigCache(): void {
  revalidateTag("creation-config", "max");
}

export async function seedCreationConfigIfEmpty(): Promise<boolean> {
  const { count } = await supabaseAdmin()
    .from("character_creation_steps")
    .select("id", { count: "exact", head: true });

  if (count && count > 0) return false;

  const payload = buildDefaultCreationConfigPayload();
  await writeCreationConfig(payload);
  return true;
}

const getCachedPublicConfig = unstable_cache(
  () => loadStepsAndOptions(true),
  ["creation-config-public"],
  { revalidate: 120, tags: ["creation-config"] },
);

export async function getPublicCreationConfig(): Promise<CreationConfig> {
  const config = await getCachedPublicConfig();
  if (config.steps.length > 0) return config;
  return configFromPublishPayload(buildDefaultCreationConfigPayload());
}

export async function getAdminCreationConfig(): Promise<CreationConfig> {
  await seedCreationConfigIfEmpty();
  return loadStepsAndOptions(false);
}

export async function publishCreationConfig(
  payload: CreationConfigPublishPayload,
): Promise<CreationConfig> {
  const config = await writeCreationConfig(payload);
  revalidateCreationConfigCache();
  return config;
}

export async function createCreationStep(input: CreationStepInput): Promise<CreationStep | null> {
  const { data, error } = await supabaseAdmin()
    .from("character_creation_steps")
    .insert({
      step_key: input.stepKey,
      label: input.label,
      description: input.description ?? null,
      step_type: input.stepType,
      sort_order: input.sortOrder ?? 0,
      is_enabled: input.isEnabled ?? true,
      is_required: input.isRequired ?? true,
      config: input.config ?? {},
    })
    .select("*")
    .single();

  if (error || !data) return null;
  revalidateCreationConfigCache();
  return mapStep(data as StepRow, []);
}

export async function updateCreationStep(
  id: string,
  patch: Partial<CreationStepInput>,
): Promise<boolean> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.stepKey !== undefined) update.step_key = patch.stepKey;
  if (patch.label !== undefined) update.label = patch.label;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.stepType !== undefined) update.step_type = patch.stepType;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;
  if (patch.isEnabled !== undefined) update.is_enabled = patch.isEnabled;
  if (patch.isRequired !== undefined) update.is_required = patch.isRequired;
  if (patch.config !== undefined) update.config = patch.config;

  const { error } = await supabaseAdmin()
    .from("character_creation_steps")
    .update(update)
    .eq("id", id);

  if (!error) revalidateCreationConfigCache();
  return !error;
}

export async function deleteCreationStep(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("character_creation_steps").delete().eq("id", id);
  if (!error) revalidateCreationConfigCache();
  return !error;
}

export async function createCreationOption(input: CreationOptionInput): Promise<CreationOption | null> {
  const { data, error } = await supabaseAdmin()
    .from("character_creation_options")
    .insert({
      step_id: input.stepId,
      option_key: input.optionKey,
      option_group: input.optionGroup ?? null,
      label: input.label,
      image_url: input.imageUrl ?? null,
      sort_order: input.sortOrder ?? 0,
      is_enabled: input.isEnabled ?? true,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) return null;
  revalidateCreationConfigCache();
  return mapOption(data as OptionRow);
}

export async function updateCreationOption(
  id: string,
  patch: Partial<CreationOptionInput>,
): Promise<boolean> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.optionKey !== undefined) update.option_key = patch.optionKey;
  if (patch.optionGroup !== undefined) update.option_group = patch.optionGroup;
  if (patch.label !== undefined) update.label = patch.label;
  if (patch.imageUrl !== undefined) update.image_url = patch.imageUrl;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;
  if (patch.isEnabled !== undefined) update.is_enabled = patch.isEnabled;
  if (patch.metadata !== undefined) update.metadata = patch.metadata;

  const { error } = await supabaseAdmin()
    .from("character_creation_options")
    .update(update)
    .eq("id", id);

  if (!error) revalidateCreationConfigCache();
  return !error;
}

export async function deleteCreationOption(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("character_creation_options").delete().eq("id", id);
  if (!error) revalidateCreationConfigCache();
  return !error;
}

export async function reorderCreationSteps(
  orderedIds: string[],
): Promise<boolean> {
  const db = supabaseAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await db
      .from("character_creation_steps")
      .update({ sort_order: i, updated_at: new Date().toISOString() })
      .eq("id", orderedIds[i]);
    if (error) return false;
  }
  revalidateCreationConfigCache();
  return true;
}

export async function reorderCreationOptions(
  stepId: string,
  orderedIds: string[],
): Promise<boolean> {
  const db = supabaseAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await db
      .from("character_creation_options")
      .update({ sort_order: i, updated_at: new Date().toISOString() })
      .eq("id", orderedIds[i])
      .eq("step_id", stepId);
    if (error) return false;
  }
  revalidateCreationConfigCache();
  return true;
}

export async function validateCharacterAgainstConfig(
  config: CreationConfig,
  body: {
    style?: string;
    appearance?: {
      ethnicity?: string;
      hairStyle?: string;
      hairColor?: string;
      bodyType?: string;
      outfit?: string;
    };
    personality?: string[];
    voicePersonaId?: string;
    relationship?: string;
    tags?: string[];
  },
): Promise<string | null> {
  const rel =
    body.relationship?.trim() ||
    body.tags?.find((t) => isValidOptionKey(config, "bond", t)) ||
    "";

  if (body.style && !isValidOptionKey(config, "style", body.style)) {
    return "Invalid style selection";
  }
  if (body.appearance?.ethnicity && !isValidOptionKey(config, "ethnicity", body.appearance.ethnicity)) {
    return "Invalid ethnicity selection";
  }
  if (body.appearance?.hairStyle && !isValidOptionKey(config, "hair", body.appearance.hairStyle, "hairStyle")) {
    return "Invalid hair style selection";
  }
  if (body.appearance?.hairColor && !isValidOptionKey(config, "hair", body.appearance.hairColor, "hairColor")) {
    return "Invalid hair color selection";
  }
  if (body.appearance?.bodyType && !isValidOptionKey(config, "body", body.appearance.bodyType)) {
    return "Invalid body type selection";
  }
  if (body.appearance?.outfit && !isValidOptionKey(config, "outfit", body.appearance.outfit)) {
    return "Invalid outfit selection";
  }
  if (body.voicePersonaId && !isValidOptionKey(config, "voice", body.voicePersonaId)) {
    return "Invalid voice selection";
  }
  if (rel && !isValidOptionKey(config, "bond", rel)) {
    return "Invalid relationship selection";
  }
  if (body.personality?.length) {
    for (const trait of body.personality) {
      if (!isValidOptionKey(config, "personality", trait)) {
        return `Invalid personality trait: ${trait}`;
      }
    }
  }
  return null;
}

function isValidOptionKey(
  config: CreationConfig,
  stepKey: string,
  optionKey: string,
  group?: string | null,
): boolean {
  const step = config.steps.find((s) => s.stepKey.toLowerCase() === stepKey.toLowerCase());
  if (!step || !step.isEnabled) {
    return true; // Skip validation if step is disabled or doesn't exist
  }
  return step.options.some(
    (o) =>
      o.isEnabled &&
      o.optionKey === optionKey &&
      (group == null || o.optionGroup === group),
  );
}
