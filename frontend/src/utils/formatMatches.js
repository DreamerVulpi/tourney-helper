export const FORMAT_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const v = `FT${i + 1}`;
  return { value: v, label: v };
});