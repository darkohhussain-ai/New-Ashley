declare module 'arabic-shaper' {
  interface ShapeOptions {
    text_direction?: 'LTR' | 'RTL';
  }
  function shape(text: string, options?: ShapeOptions): string;
}
