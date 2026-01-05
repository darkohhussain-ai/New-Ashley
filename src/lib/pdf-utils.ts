
/**
 * Prepares text for jsPDF by reversing it for RTL languages like Kurdish.
 * This is a critical step for ensuring correct word and character order in the PDF.
 * The font itself is responsible for contextual letter shaping (joining).
 * @param text The text to process.
 * @returns The processed, reversed text ready for jsPDF.
 */
export function shapeText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }
  // This reversal is necessary for jsPDF to render RTL text correctly.
  return text.split('').reverse().join('');
}
