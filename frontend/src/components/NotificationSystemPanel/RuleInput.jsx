export function RuleInput ({
  label,
  value,
  onChange,
  icon: Icon,
  themeClasses,
  type = "number", // "number" or "select"
  min = 1,
  max = 99,
  suffix = "", // for "min." or "sec."
  prefix = "", // for "FT"
}) {
  
  const commonClasses = `w-full rounded-xl px-4 py-3 text-sm font-black border outline-none transition-all focus:border-blue-500/50 appearance-none ${themeClasses.input}`;

  const handleChange = (val) => {
    let num = parseInt(val);
    if (isNaN(num)) num = min;
    if (num > max) num = max;
    if (num < min) num = min;
    onChange(num);
  };

  return (
    <div className="space-y-1.5">
      <label
        className={`text-[9px] font-black uppercase flex items-center gap-2 ${themeClasses.label || themeClasses.textMuted}`}
      >
        {Icon && <Icon size={12} className="text-blue-500" />}
        {label}
      </label>

      <div className="relative group">
        {type === "select" ? (
            // TODO: Replace to DropdownList.jsx
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={commonClasses}
          >
            {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(
              (n) => (
                <option key={n} value={n} className="bg-black text-white">
                  {prefix}
                  {n}
                  {suffix}
                </option>
              ),
            )}
          </select>
        ) : (
          <div className="relative">
            <input
              type="number"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              className={commonClasses}
            />
            {suffix && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-40 uppercase italic pointer-events-none">
                {suffix}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};