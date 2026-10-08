import { useMemo } from "react";
import { useAppStore } from "../../store/useAppStore";
import { buildAuthorizedIntegrationItems } from "../../utils/integrations";

/**
 * @param {Object} [options]
 * @param {string|string[]} [options.category] - "tournament" | "delivery" | массив
 */
export function useAuthorizedIntegrations(options = {}) {
  const authorizations = useAppStore((s) => s.authorizations);
  const { category } = options;

  // стабилизируем ключ, чтобы useMemo не дёргался на новый массив каждый рендер
  const categoryKey = Array.isArray(category)
    ? category.slice().sort().join("|")
    : category || "";

  return useMemo(() => {
    const all = buildAuthorizedIntegrationItems(authorizations);
    if (!categoryKey) return all;

    const set = new Set(categoryKey.split("|"));
    return all.filter((i) => set.has(i.category));
  }, [authorizations, categoryKey]);
}