import DOMPurify from "isomorphic-dompurify";

export function sanitizeText(input: string | undefined | null, maxLen = 5000): string {
  if (!input) return "";
  return DOMPurify.sanitize(String(input), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).slice(0, maxLen);
}
