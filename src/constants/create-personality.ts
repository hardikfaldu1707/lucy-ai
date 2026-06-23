export const CREATE_PERSONALITY_TRAITS = [
  "Shy",
  "Romantic",
  "Playful",
  "Caring",
  "Bold",
  "Mysterious",
  "Witty",
  "Adventurous",
  "Gentle",
  "Flirty",
  "Intellectual",
  "Dominant",
  "Submissive",
  "Gamer",
  "Artistic",
  "Fitness",
] as const;

export const CREATE_RELATIONSHIP_TYPES = [
  "Girlfriend",
  "Best friend",
  "Crush",
  "Wife",
  "Roommate",
  "Mentor",
  "Secret admirer",
  "Fling",
] as const;

export type CreatePersonalityTrait = (typeof CREATE_PERSONALITY_TRAITS)[number];
export type CreateRelationshipType = (typeof CREATE_RELATIONSHIP_TYPES)[number];
