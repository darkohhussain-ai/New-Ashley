/**
 * Reverses a string to handle basic RTL display in jsPDF.
 * This is a simplified approach and does not handle complex script shaping.
 * @param text The text to process.
 * @returns The reversed text for RTL rendering.
 */
export function shapeText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }
  // For RTL, jsPDF often requires the string to be visually ordered (reversed).
  return text.split('').reverse().join('');
}
