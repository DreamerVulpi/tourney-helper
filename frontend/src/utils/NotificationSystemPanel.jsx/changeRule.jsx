export function changeRule(field, value, updateConfig) {
  updateConfig("tournament", {
    rules: {
      [field]: value,
    },
  });
}