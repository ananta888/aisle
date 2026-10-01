import type { TrackState } from "../domain/target-track";

export type GuidanceKind =
  | "search"
  | "move"
  | "forward"
  | "reached"
  | "waiting";

export interface GuidanceInstruction {
  text: string;
  kind: GuidanceKind;
}

export interface GuidanceConfig {
  reachHeight: number;
}

export const DEFAULT_GUIDANCE_CONFIG: GuidanceConfig = { reachHeight: 0.5 };

export function instructionFor(
  track: TrackState,
  config: GuidanceConfig = DEFAULT_GUIDANCE_CONFIG,
): GuidanceInstruction {
  if (track.status === "searching" || track.status === "lost") {
    return searchInstruction(track);
  }

  const position = track.position;
  if (!position) {
    return { text: "Ich kann das Produkt noch nicht erkennen.", kind: "search" };
  }

  if (position.vertical === "up") {
    return { text: "Schwenke etwas nach oben.", kind: "move" };
  }
  if (position.vertical === "down") {
    return { text: "Schwenke etwas nach unten.", kind: "move" };
  }
  if (position.horizontal === "left") {
    return { text: "Etwas nach links.", kind: "move" };
  }
  if (position.horizontal === "right") {
    return { text: "Etwas nach rechts.", kind: "move" };
  }

  const height = track.boundingBox?.height ?? 0;
  if (height >= config.reachHeight) {
    return { text: "Das Produkt ist direkt vor dir.", kind: "reached" };
  }
  return { text: "Geradeaus.", kind: "forward" };
}

function searchInstruction(track: TrackState): GuidanceInstruction {
  const position = track.position;
  if (position?.horizontal === "left") {
    return { text: "Bewege das Handy langsam nach links.", kind: "search" };
  }
  if (position?.horizontal === "right") {
    return { text: "Bewege das Handy langsam nach rechts.", kind: "search" };
  }
  if (position?.vertical === "up") {
    return { text: "Schwenke das Handy etwas nach oben.", kind: "search" };
  }
  if (position?.vertical === "down") {
    return { text: "Schwenke das Handy etwas nach unten.", kind: "search" };
  }
  return {
    text: "Ich kann das Produkt noch nicht erkennen. Schwenke das Handy langsam hin und her.",
    kind: "search",
  };
}
