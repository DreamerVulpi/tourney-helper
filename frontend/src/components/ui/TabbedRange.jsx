import React from "react";

import { Field } from "./Field.jsx";

export function TabbedRange({
  tabs,
  activeTab,
  onChangeTab,
  themeClasses,
  className = "",
}) {
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  if (!active) return null;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`
              flex-1 px-0.5 py-1 rounded-lg border
              text-[8px] leading-none font-black uppercase italic whitespace-nowrap
              transition-colors
              ${
                tab.id === active.id
                  ? "bg-blue-600 text-white border-blue-500"
                  : themeClasses.button
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Field
        variant="range"
        solid={true}
        min={active.min}
        max={active.max}
        step={active.step}
        value={active.value}
        onChange={active.onChange}
        resetValue={active.resetValue}
        formatValue={active.formatValue}
        rangeMinIcon={active.rangeMinIcon}
        rangeMaxIcon={active.rangeMaxIcon}
        themeClasses={themeClasses}
      />
    </div>
  );
}
