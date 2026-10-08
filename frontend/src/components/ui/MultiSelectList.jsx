import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export function MultiSelectList({
  selectedValues = [],
  items = [],
  onChange,
  icon: Icon,
  iconSize = 14,
  themeClasses,
  className = "",
  style,
  placeholder = "Select...",
  maxVisible = 3,
  itemHeight = 32,
  searchable = false,
  single = false,
  locale,
  renderItem,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, searchable]);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query, searchable]);

  const toggle = (value) => {
    if (single) {
      const isSelected = selectedValues.includes(value);
      onChange(isSelected ? [] : [value]);
      setOpen(false);
      setQuery("");
      return;
    }
    const set = new Set(selectedValues);
    set.has(value) ? set.delete(value) : set.add(value);
    onChange(Array.from(set));
  };

  const selectedLabels = items
    .filter((i) => selectedValues.includes(i.value))
    .map((i) => (i.needsReauth ? `⚠ ${i.label}` : i.label))
    .join(", ");

  const searchHeight = searchable ? 36 : 0;
  const listMaxHeight = maxVisible * itemHeight + searchHeight;

  return (
    <div ref={ref} className="relative w-full" style={style}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ height: style?.height }}
        className={`
          w-full flex items-center gap-2
          rounded-xl border px-3
          text-xs font-bold text-left
          ${themeClasses.field}
          ${className}
        `}
      >
        {Icon && <Icon size={iconSize} className="text-blue-600 shrink-0" />}
        <span className="truncate flex-1">
          {selectedLabels || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`
            absolute z-50 mt-1 w-full
            rounded-xl border overflow-hidden
            ${themeClasses.listMenu}
          `}
        >
          {searchable && (
            <div
              className={`flex items-center gap-2 px-3 border-b ${themeClasses.divider}`}
              style={{ height: searchHeight }}
            >
              <Search size={13} className="opacity-50 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={locale.SearchLabel}
                className="flex-1 bg-transparent outline-none text-xs font-bold placeholder:opacity-40"
              />
            </div>
          )}

          <div
            className="overflow-y-auto custom-scrollbar"
            style={{ maxHeight: listMaxHeight - searchHeight }}
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs opacity-50 text-center">
                {locale.NoClients}
              </div>
            ) : (
              filtered.map((item) => {
                const checked = selectedValues.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggle(item.value)}
                    style={{ height: itemHeight }}
                    className={`
                      w-full flex items-center gap-2
                      px-3 text-xs font-bold text-left
                      hover:bg-white/5
                      ${checked ? "text-blue-500" : ""}
                    `}
                  >
                    <span
                      className={`
                        w-4 h-4 flex items-center justify-center shrink-0
                        ${single ? "rounded-full" : "rounded"}
                        border
                        ${checked
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-400/50"
                        }
                      `}
                    >
                      {checked && (
                        single
                          ? <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          : <Check size={11} strokeWidth={3} />
                      )}
                    </span>
                    
                    {item.needsReauth && (
                      <span
                        className="ml-auto shrink-0 text-[8px] font-black uppercase italic text-orange-500"
                        title={item.status || "Expired"}
                      >
                        {item.status || "Expired"}
                      </span>
                    )}
                    {renderItem ? (
                      renderItem(item, { checked, single })
                    ) : (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}