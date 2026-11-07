import { useCallback, useLayoutEffect, useRef, useState } from "react";

const VIEWPORT_PADDING = 8;

// Меню рендерится скрытым на первом кадре, чтобы измерить его реальную высоту
// и сразу открыть в правильном направлении без мигания.
export const HIDDEN_MENU_STYLE = {
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
  pointerEvents: "none",
  zIndex: 9999,
};

export function useFloatingMenu({ anchorRef, open, minWidthRem = 0 }) {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  const update = useCallback(() => {
    const anchor = anchorRef?.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const rect = anchor.getBoundingClientRect();
    const rootFontSize =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const minWidth = minWidthRem * rootFontSize;
    const maxWidth = window.innerWidth - VIEWPORT_PADDING * 2;

    const width = Math.min(Math.max(rect.width, minWidth), maxWidth);

    let left = rect.left;
    if (left + width > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - VIEWPORT_PADDING - width;
    }
    if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;

    const menuHeight = menu.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
    const openAbove = spaceBelow < menuHeight;

    setMenuStyle({
      position: "fixed",
      left,
      width,
      top: openAbove ? undefined : rect.bottom + VIEWPORT_PADDING,
      bottom: openAbove ? window.innerHeight - rect.top + VIEWPORT_PADDING : undefined,
      zIndex: 9999,
    });
  }, [anchorRef, minWidthRem]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    update();
    const raf = requestAnimationFrame(update);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return { menuRef, menuStyle };
}
