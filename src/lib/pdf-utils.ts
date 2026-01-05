
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
  // Reverse the string for correct RTL rendering in jsPDF
  return text.split('').reverse().join('');
}
