/**
 * Checks if a string contains Arabic/Kurdish characters.
 * @param text The text to check.
 * @returns True if the text contains RTL characters.
 */
function containsRtl(text: string | null | undefined): boolean {
  if (!text) return false;
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  return rtlRegex.test(text);
}


/**
 * Reverses a string to handle basic RTL display in jsPDF if it contains RTL characters.
 * Otherwise, it returns the string as is for LTR languages.
 * @param text The text to process.
 * @param language The current language code ('ku' or 'en').
 * @returns The processed text for jsPDF rendering.
 */
export function shapeText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }
  // Only reverse the text if it contains RTL characters.
  if (containsRtl(text)) {
    return text.split('').reverse().join('');
  }
  return text;
}
