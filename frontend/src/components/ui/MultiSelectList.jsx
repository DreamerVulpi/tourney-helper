import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Pencil, Search } from "lucide-react";
import { debounce } from "../../utils/debounce";

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
  locale = "No items",
  renderItem,

  // --- rename ---
  onRename,
  validateRename,
}) {
  console.log("[MSL] RENDER items:", items, "selectedValues:", selectedValues, "single:", single);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // --- rename state ---
  const canRename = Boolean(single && onRename);
  const currentValue = selectedValues[0] ?? "";
  const currentItem = items.find((i) => i.value === currentValue);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [renameError, setRenameError] = useState(null);
  const [saving, setSaving] = useState(false);

  const editingRef = useRef(false);
  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  const ref = useRef(null);
  const inputRef = useRef(null);
  const renameInputRef = useRef(null);

  const openDelayed = useMemo(
    () =>
      debounce(() => {
        if (editingRef.current) return;
        setOpen(true);
      }, 200),
    []
  );

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

  // --- Escape ---
  useEffect(() => {
    if (!open && !editing) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        if (editing) {
          cancelRename();
        } else {
          setOpen(false);
          setQuery("");
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  useEffect(() => {
    if (open && searchable) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, searchable]);

  useEffect(() => {
    if (editing) {
      const t = setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [editing]);

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

  // --- rename ---
  const startRename = (e) => {
    e.stopPropagation();
    if (openDelayed.cancel) openDelayed.cancel();
    setOpen(false);
    setQuery("");
    setDraft(currentValue);
    setRenameError(null);
    setEditing(true);
  };

  const cancelRename = () => {
    setEditing(false);
    setDraft("");
    setRenameError(null);
  };

  const commitRename = async () => {
    if (!canRename) return;
    const trimmed = draft.trim();

    if (trimmed === currentValue) {
      cancelRename();
      return;
    }

    if (validateRename) {
      const err = validateRename(trimmed);
      if (err) {
        setRenameError(err);
        return;
      }
    }

    setSaving(true);
    try {
      await onRename(currentValue, trimmed);
      cancelRename();
    } catch (e) {
      setRenameError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const handleButtonClick = () => {
    if (open) {
      setOpen(false);
      setQuery("");
      return;
    }
    openDelayed();
  };

  const searchHeight = searchable ? 36 : 0;
  const listMaxHeight = maxVisible * itemHeight + searchHeight;

  console.log("[MSL] BEFORE RETURN items:", items, "filtered:", filtered, "selectedLabels:", selectedLabels);
  return (
    <div ref={ref} className="relative w-full" style={style}>
      {editing ? (
        <div className="w-full">
          <div
            className={`
              w-full flex items-center gap-2
              rounded-xl border px-3
              ${themeClasses.field}
              ${className}
              ${renameError ? "border-red-500" : ""}
            `}
            style={{ height: style?.height }}
          >
            {Icon && <Icon size={iconSize} className="text-blue-600 shrink-0" />}
            <input
              ref={renameInputRef}
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (renameError) setRenameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void commitRename();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelRename();
                }
              }}
              onBlur={() => {
                if (!saving) void commitRename();
              }}
              disabled={saving}
              className="flex-1 bg-transparent outline-none text-xs font-bold min-w-0"
            />
          </div>
          {renameError && (
            <div className="mt-1 px-1 text-[10px] text-red-500 font-bold">
              {renameError}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleButtonClick}
          onDoubleClick={canRename && currentValue ? startRename : undefined}
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

          {canRename && currentValue && (
            <span
              role="button"
              tabIndex={0}
              onClick={startRename}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  startRename(e);
                }
              }}
              className="shrink-0 p-1 rounded hover:bg-white/10 cursor-pointer"
            >
              <Pencil size={12} className="opacity-60" />
            </span>
          )}

          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {open && !editing && (
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
                placeholder={locale?.SearchLabel ?? "Search..."}
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
                {locale?.NoClients ?? "No items"}
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