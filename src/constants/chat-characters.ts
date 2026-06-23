import { DISCOVERY_CHARACTERS } from "./discovery-characters";
import {
  GRID_CHARACTERS,
  LANDING_CHARACTERS,
  type LandingCharacter,
} from "./landing-characters";

/** All AI characters shown on the public chat browse page (deduped by id). */
export const BROWSE_CHAT_CHARACTERS: LandingCharacter[] = [
  ...LANDING_CHARACTERS,
  ...GRID_CHARACTERS,
  ...DISCOVERY_CHARACTERS,
].filter((c, index, arr) => arr.findIndex((x) => x.id === c.id) === index);

export function getBrowseCharacterById(id: string): LandingCharacter | undefined {
  return BROWSE_CHAT_CHARACTERS.find((c) => c.id === id);
}
