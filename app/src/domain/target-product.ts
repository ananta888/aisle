const ARTICLES = new Set([
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "einen",
  "einem",
  "eines",
  "the",
  "a",
  "an",
]);

export interface TargetProduct {
  readonly name: string;
  readonly normalized: string;
}

export function normalizeProductName(input: string): string {
  const tokens = input
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:()"']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  while (tokens.length > 1 && ARTICLES.has(tokens[0]!)) {
    tokens.shift();
  }
  return tokens.join(" ");
}

export function targetProduct(name: string): TargetProduct {
  const cleaned = name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[\s.,!?;:]+/g, "")
    .replace(/[\s.,!?;:]+$/g, "");
  return { name: cleaned, normalized: normalizeProductName(cleaned) };
}

export function sameProduct(
  a: Pick<TargetProduct, "normalized">,
  b: Pick<TargetProduct, "normalized">,
): boolean {
  return a.normalized === b.normalized;
}
