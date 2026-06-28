export type CreationStepType =
  | "single_select"
  | "dual_select"
  | "identity"
  | "multi_select"
  | "voice"
  | "review";

export type CreationStepConfig = {
  minAge?: number;
  maxAge?: number;
  maxSelections?: number;
  groups?: string[];
  storageKey?: string;
  nameLabel?: string;
  ageLabel?: string;
};

export type CreationOptionMetadata = {
  description?: string;
  voiceId?: string;
  behavior?: string;
  speechHint?: string;
  exampleLine?: string;
  role?: string;
  dynamic?: string;
  boundaries?: string;
  sentenceLength?: string;
  emojiLevel?: string;
  toneNote?: string;
};

export type CreationOption = {
  id: string;
  stepId: string;
  optionKey: string;
  optionGroup: string | null;
  label: string;
  imageUrl: string | null;
  sortOrder: number;
  isEnabled: boolean;
  metadata: CreationOptionMetadata;
};

export type CreationStep = {
  id: string;
  stepKey: string;
  label: string;
  description: string | null;
  stepType: CreationStepType;
  sortOrder: number;
  isEnabled: boolean;
  isRequired: boolean;
  config: CreationStepConfig;
  options: CreationOption[];
};

export type CreationConfig = {
  steps: CreationStep[];
};

export type CreationStepInput = {
  stepKey: string;
  label: string;
  description?: string | null;
  stepType: CreationStepType;
  sortOrder?: number;
  isEnabled?: boolean;
  isRequired?: boolean;
  config?: CreationStepConfig;
};

export type CreationOptionInput = {
  stepId: string;
  optionKey: string;
  optionGroup?: string | null;
  label: string;
  imageUrl?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
  metadata?: CreationOptionMetadata;
};

export type CreationConfigPublishPayload = {
  steps: Array<{
    id?: string;
    stepKey: string;
    label: string;
    description?: string | null;
    stepType: CreationStepType;
    sortOrder: number;
    isEnabled: boolean;
    isRequired: boolean;
    config?: CreationStepConfig;
    options: Array<{
      id?: string;
      optionKey: string;
      optionGroup?: string | null;
      label: string;
      imageUrl?: string | null;
      sortOrder: number;
      isEnabled: boolean;
      metadata?: CreationOptionMetadata;
    }>;
  }>;
};
