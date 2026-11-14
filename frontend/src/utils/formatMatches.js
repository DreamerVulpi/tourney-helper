const BO_VALUES = [1, 2, 3, 5, 7];

const formats = [];

for (let i = 1; i <= 10; i++) {
  formats.push({ value: `FT${i}`, label: `FT${i}`, order: i, group: 0 });
  if (BO_VALUES.includes(i)) {
    formats.push({ value: `BO${i}`, label: `BO${i}`, order: i, group: 1 });
  }
}

formats.sort((a, b) => a.order - b.order || a.group - b.group);

export const FORMAT_OPTIONS = formats.map(({ value, label }) => ({
  value,
  label,
}));
