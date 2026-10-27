export function changeRule(field, value, updateConfig) {
  updateConfig("tools", {
    notificationSystem: {
      rules: {
        [field]: value,
      },
    },
  });
}