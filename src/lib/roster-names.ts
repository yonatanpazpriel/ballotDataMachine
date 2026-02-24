import { PROSECUTION_KEYS, DEFENSE_KEYS, type ScoreKey } from "@/lib/constants";
import type { OurSide } from "@/lib/types";
import type { TournamentRoster } from "@/lib/types";

/**
 * Returns the roster-derived name for a score key on the given side, or null if
 * the roster has no name for that slot. Used when auto-populating or updating
 * ballot name fields (Open, Close, Direct 1/2/3: Witness, Cross 1/2/3: Witness).
 */
export function getRosterNameForScoreKey(
  roster: TournamentRoster,
  side: OurSide,
  key: ScoreKey,
): string | null {
  const keys = side === "P" ? PROSECUTION_KEYS : DEFENSE_KEYS;
  const sideRoster = side === "P" ? roster.prosecution : roster.defense;

  const openKey = keys.find((k) => k.includes("Open"));
  const closeKey = keys.find((k) => k.includes("Close"));
  const directWitnessKeys = keys.filter((k) => k.includes("Direct") && k.includes("Witness"));
  const crossWitnessKeys = keys.filter((k) => k.includes("Cross") && k.includes("Witness"));

  if (key === openKey && sideRoster.attorneys.opener.trim()) {
    return sideRoster.attorneys.opener.trim();
  }
  if (key === closeKey && sideRoster.attorneys.closer.trim()) {
    return sideRoster.attorneys.closer.trim();
  }

  const directIdx = directWitnessKeys.indexOf(key as typeof directWitnessKeys[number]);
  if (directIdx !== -1 && sideRoster.witnesses[directIdx]?.trim()) {
    return sideRoster.witnesses[directIdx].trim();
  }
  const crossIdx = crossWitnessKeys.indexOf(key as typeof crossWitnessKeys[number]);
  if (crossIdx !== -1 && sideRoster.witnesses[crossIdx]?.trim()) {
    return sideRoster.witnesses[crossIdx].trim();
  }

  return null;
}
