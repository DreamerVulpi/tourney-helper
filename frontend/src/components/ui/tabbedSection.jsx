import React from "react";
import "../../styles/scrollbar.css";

/**
 * Универсальная секция с горизонтальными вкладками.
 *
 * @param {Array}    tabs      — [{ id, icon, label }]
 * @param {string}   activeTab — id активной вкладки
 * @param {Function} onChange  — (id) => void
 * @param {Function} children  — (activeTab) => ReactNode
 * @param {object}   themeClasses
 * @param {string}   className — доп. классы для внешнего контейнера
 */
export const TabbedSection = ({
  tabs, activeTab, onChange, children, themeClasses,
  padding = "p-6",
  rounding = "rounded-[2.5rem]",
  spacing = "space-y-6",
  className = "",
}) => {
  return (
     <div
      className={`
        flex flex-col flex-1 min-h-0
        ${padding} ${rounding} border ${spacing}
        ${themeClasses.section} ${className}
      `}
    >
      {/* вкладки */}
      <div className={`shrink-0 flex items-center gap-3 border-b pb-3 ${themeClasses.divider}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                console.log("tab click:", tab.id);
                onChange(tab.id);
              }}    
              className={`
                flex items-center gap-2 transition-all duration-200
                ${isActive ? "opacity-100 scale-105" : "opacity-40 hover:opacity-70"}
              `}
            >
              <Icon size={16} className="text-blue-500" />
              <span
                className={`text-[10px] font-black uppercase italic ${themeClasses.label}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex flex-col pr-2">
        {typeof children === "function" ? children(activeTab) : children}
      </div>
    </div>
  );
};