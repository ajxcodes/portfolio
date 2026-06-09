/**
 * Converts a string into a URL-friendly slug.
 * Example: "Provision Analytics" -> "provision-analytics"
 */
export function toSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
