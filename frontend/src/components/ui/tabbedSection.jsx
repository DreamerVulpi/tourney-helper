import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  spacing = "space-y-1",
  className = "",
}) => {
  const tabsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    setHasOverflow(maxScroll > 1);
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(maxScroll > 1 && el.scrollLeft < maxScroll - 1);
  }, []);

  useLayoutEffect(() => {
    updateScrollState();
  });

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    window.addEventListener("resize", updateScrollState);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const active = el.querySelector('[data-tab-active="true"]');
    if (!active) return;

    const padding = 12;
    const containerRect = el.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    let delta = 0;
    if (activeRect.left < containerRect.left + padding) {
      delta = activeRect.left - containerRect.left - padding;
    } else if (activeRect.right > containerRect.right - padding) {
      delta = activeRect.right - containerRect.right + padding;
    }

    if (delta !== 0) {
      el.scrollBy({ left: delta, behavior: "smooth" });
    }
  }, [activeTab]);

  const scrollTabs = (direction) => {
    const el = tabsRef.current;
    if (!el) return;

    const amount = Math.max(el.clientWidth * 0.65, 100);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
     <div
      className={`
        flex flex-col flex-1 min-h-0
        ${padding} ${rounding} border ${spacing}
        ${themeClasses.section} ${className}
      `}
    >
      {/* вкладки */}
      <div className={`shrink-0 flex items-center gap-1 border-b pb-3 ${themeClasses.divider}`}>
        {hasOverflow && (
          <button
            type="button"
            onClick={() => scrollTabs(-1)}
            aria-label="Scroll tabs left"
            disabled={!canScrollLeft}
            className={`shrink-0 p-1 rounded-md transition-colors ${themeClasses.label} ${
              canScrollLeft
                ? "opacity-60 hover:opacity-100 hover:bg-white/10"
                : "opacity-20 cursor-default"
            }`}
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <div
          ref={tabsRef}
          onScroll={updateScrollState}
          className="flex flex-1 min-w-0 items-center gap-3 overflow-x-auto no-scrollbar px-1.5 py-1"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onChange(tab.id);
                }}
                data-tab-active={isActive ? "true" : "false"}
                className={`
                  flex shrink-0 items-center gap-2 transition-all duration-200
                  ${isActive ? "opacity-100 scale-105" : "opacity-40 hover:opacity-70"}
                `}
              >
                <Icon size={16} className="text-blue-500" />
                <span
                  className={`text-[10px] font-black uppercase italic whitespace-nowrap ${themeClasses.label}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {hasOverflow && (
          <button
            type="button"
            onClick={() => scrollTabs(1)}
            aria-label="Scroll tabs right"
            disabled={!canScrollRight}
            className={`shrink-0 p-1 rounded-md transition-colors ${themeClasses.label} ${
              canScrollRight
                ? "opacity-60 hover:opacity-100 hover:bg-white/10"
                : "opacity-20 cursor-default"
            }`}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col pr-2">
        {typeof children === "function" ? children(activeTab) : children}
      </div>
    </div>
  );
};
