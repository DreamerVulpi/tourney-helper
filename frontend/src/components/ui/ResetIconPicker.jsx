import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { ChevronDown, Crown, Pencil, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { HIDDEN_MENU_STYLE, useFloatingMenu } from "./useFloatingMenu.jsx";

const LUCIDE_ICON_LIST = (() => {
  const unique = new Map();

  Object.entries(LucideIcons).forEach(([exportName, value]) => {
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      return;
    }
    if (exportName.endsWith("Icon")) return;
    if (exportName === "icons" || exportName === "useLucideContext") return;

    const name = value.displayName || exportName;
    if (!/^[A-Z]/.test(name)) return;
    if (!unique.has(name)) unique.set(name, value);
  });

  return Array.from(unique, ([name, Icon]) => ({ name, Icon })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
})();

const LUCIDE_BY_NAME = new Map(
  LUCIDE_ICON_LIST.map((item) => [item.name, item.Icon]),
);

const dataUrlCache = new Map();

function lucideDataUrl(name) {
  if (dataUrlCache.has(name)) return dataUrlCache.get(name);

  const Icon = LUCIDE_BY_NAME.get(name);
  if (!Icon) return "";

  const svg = renderToStaticMarkup(
    React.createElement(Icon, {
      size: 24,
      strokeWidth: 2,
      color: "black",
    }),
  );
  const dataUrl = `data:image/svg+xml;base64,${window.btoa(
    unescape(encodeURIComponent(svg)),
  )}`;
  dataUrlCache.set(name, dataUrl);
  return dataUrl;
}

const stripExtension = (name) =>
  name ? String(name).replace(/\.[^.]+$/, "") : "";

const isLucideValue = (value) =>
  typeof value === "string" && value.startsWith("lucide:");

const lucideName = (value) =>
  isLucideValue(value) ? value.slice("lucide:".length) : "";

export function ResetIconPreview({
  value,
  iconData,
  customIcons = [],
  size = 16,
  emptyClassName = "text-slate-500 opacity-50",
}) {
  const iconName = lucideName(value);
  const custom = customIcons.find((item) => item.value === value);

  if (iconName) {
    const mask = iconData || lucideDataUrl(iconName);
    if (!mask) {
      return <Crown size={size} className={emptyClassName} />;
    }

    return (
      <span
        className="block"
        style={{
          width: size,
          height: size,
          backgroundColor: "currentColor",
          WebkitMaskImage: `url("${mask}")`,
          maskImage: `url("${mask}")`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }

  const src = custom?.dataUrl ||
    (/^(https?:|data:|blob:)/i.test(value || "") ? value : "");

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }

  return <Crown size={size} className={emptyClassName} />;
}

export function ResetIconPicker({
  value = "",
  iconData = "",
  customIcons = [],
  onChange,
  onRenameCustom,
  onDeleteCustom,
  locale,
  themeClasses,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(200);
  const anchorRef = useRef(null);
  const { menuRef, menuStyle } = useFloatingMenu({
    anchorRef,
    open,
    minWidthRem: 24,
  });

  useEffect(() => {
    if (!open) {
      setSearch("");
      setVisibleCount(200);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handler = (event) => {
      const inAnchor = anchorRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inAnchor && !inMenu) setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, menuRef]);

  const query = search.trim().toLowerCase();

  const filteredIcons = useMemo(() => {
    if (!query) return LUCIDE_ICON_LIST;
    return LUCIDE_ICON_LIST.filter((icon) =>
      icon.name.toLowerCase().includes(query),
    );
  }, [query]);

  useEffect(() => {
    setVisibleCount(200);
  }, [query]);

  const handleMenuScroll = (event) => {
    const el = event.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      setVisibleCount((count) =>
        Math.min(count + 200, filteredIcons.length),
      );
    }
  };

  const selectLucide = (icon) => {
    onChange?.({
      icon: `lucide:${icon.name}`,
      iconData: lucideDataUrl(icon.name),
    });
    setOpen(false);
  };

  const selectCustom = (item) => {
    onChange?.({ icon: item.value, iconData: "" });
    setOpen(false);
  };

  const selectNone = () => {
    onChange?.({ icon: "", iconData: "" });
    setOpen(false);
  };

  const renameCustom = (item) => {
    setOpen(false);
    onRenameCustom?.(item);
  };

  const deleteCustom = (item) => {
    setOpen(false);
    onDeleteCustom?.(item);
  };

  const iconName = lucideName(value);
  const customSelected = customIcons.find((item) => item.value === value);
  const selectedLabel = iconName
    ? iconName
    : value
      ? customSelected?.label || stripExtension(value)
      : locale.NoIconLabel;

  return (
    <div ref={anchorRef} className="relative w-full">
      <div className="flex flex-col gap-1 w-full">
        <span
          className={`text-xs font-black uppercase italic px-1 shrink-0 ${themeClasses.label}`}
        >
          {locale.ResetIconLabel}
        </span>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          style={{ height: "1.9rem" }}
          className={`w-full min-w-0 flex items-center justify-between gap-2 overflow-hidden rounded-xl border px-4 ${themeClasses.field}`}
        >
          <span className="flex flex-1 items-center gap-2 min-w-0">
            <span className="shrink-0 flex items-center justify-center w-4 h-4">
              <ResetIconPreview
                value={value}
                iconData={iconData}
                customIcons={customIcons}
                size={16}
              />
            </span>
            <span className="truncate text-xs font-bold">{selectedLabel}</span>
          </span>

          <ChevronDown
            size={14}
            className={`opacity-60 shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle ?? HIDDEN_MENU_STYLE}
            onScroll={handleMenuScroll}
            className={`max-h-80 overflow-y-auto custom-scrollbar rounded-xl border shadow-xl p-2 ${themeClasses.solidField || themeClasses.field}`}
          >
            <div className="sticky top-0 z-10 pb-2 bg-inherit">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={locale.SearchIconsPlaceholder}
                autoFocus
                className={`w-full rounded-lg border px-3 py-1.5 text-xs font-bold outline-none ${themeClasses.solidField || themeClasses.field}`}
              />
            </div>

            <button
              type="button"
              onClick={selectNone}
              className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold transition-colors hover:bg-blue-600 hover:text-white ${
                !value ? "bg-blue-600 text-white" : ""
              }`}
            >
              <Crown size={14} className="shrink-0" />
              <span className="truncate">{locale.NoIconLabel}</span>
            </button>

            {customIcons.length > 0 && (
              <div className="mt-2">
                <div className="px-1 pb-1 text-[10px] font-black uppercase italic opacity-50">
                  {locale.CustomIconsLabel}
                </div>
                <div className="flex flex-col gap-0.5">
                  {customIcons.map((item) => (
                    <div
                      key={item.value}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-colors ${
                        value === item.value
                          ? "bg-blue-600 text-white"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <button
                        type="button"
                        title={item.label}
                        onClick={() => selectCustom(item)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      >
                        {item.dataUrl ? (
                          <img
                            src={item.dataUrl}
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                          />
                        ) : (
                          <Crown size={14} className="shrink-0" />
                        )}
                        <span className="truncate text-xs font-bold">
                          {item.label}
                        </span>
                      </button>

                      <span
                        role="button"
                        tabIndex={0}
                        title={locale.RenameIconTitle}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          renameCustom(item);
                        }}
                        className="shrink-0 p-1 rounded hover:bg-white/10 cursor-pointer"
                      >
                        <Pencil size={12} />
                      </span>

                      <span
                        role="button"
                        tabIndex={0}
                        title={locale.DeleteIconTitle}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustom(item);
                        }}
                        className="shrink-0 p-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2">
              <div className="px-1 pb-1 text-[10px] font-black uppercase italic opacity-50">
                Lucide
              </div>
              <div className="grid grid-cols-10 gap-1">
                {filteredIcons
                  .slice(0, visibleCount)
                  .map(({ name, Icon }) => (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => selectLucide({ name, Icon })}
                      className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors hover:bg-blue-600 hover:text-white ${
                        value === `lucide:${name}`
                          ? "bg-blue-600 text-white ring-1 ring-blue-400"
                          : ""
                      }`}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
              </div>

              {filteredIcons.length === 0 && (
                <div className="py-3 text-center text-[10px] opacity-50">
                  —
                </div>
              )}

              {visibleCount < filteredIcons.length && (
                <div className="py-2 text-center text-[10px] opacity-50">
                  {visibleCount} / {filteredIcons.length}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default ResetIconPicker;
