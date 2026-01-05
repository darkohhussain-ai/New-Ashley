
/**
 * Prepares text for jsPDF by reversing it for RTL languages.
 * This is a simplified approach for scripts like Arabic and Kurdish.
 * Note: This does not perform contextual letter shaping. The chosen font must support this.
 * @param text The text to process.
 * @returns The processed text, ready for jsPDF.
 */
export function shapeText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }
  // This is a basic reversal for RTL text. For full Arabic/Kurdish script shaping,
  // a more advanced library that handles contextual forms would be needed.
  // However, for many modern PDF viewers and embedded fonts, this is sufficient.
  return text.split('').reverse().join('');
}
