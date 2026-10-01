import { targetProduct, type TargetProduct } from "../domain/target-product";

const REQUEST_PATTERN =
  /(?:ich\s+suche|suche|ich\s+brauche|brauche|finde|wo\s+ist|wo\s+finde\s+ich)\s+(?:nach\s+|mir\s+)?(.+)/i;

export function parseProductRequest(text: string | null): TargetProduct | null {
  if (text === null) return null;
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  const match = REQUEST_PATTERN.exec(trimmed);
  const name = (match?.[1] ?? trimmed).trim();
  if (name.length === 0) return null;
  return targetProduct(name);
}
