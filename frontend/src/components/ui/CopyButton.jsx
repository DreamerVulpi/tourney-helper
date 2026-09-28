import { Copy, Check } from "lucide-react";
import { useClipboard } from "../../hooks/useClipboard.jsx";

export function CopyButton({
  text,
  timeout = 2000,
  className = "",
  iconSize = 12,
  themeClasses,
}) {
  const { copied, copy } = useClipboard(timeout);

  return (
    <button
      onClick={() => copy(text)}
      className={`
        p-1.5
        rounded-md
        shrink-0
        transition-colors
        ${
          copied
            ? themeClasses?.copyButtonCopied ?? "bg-green-600 text-white"
            : themeClasses?.copyButton ?? "bg-white hover:bg-slate-100 text-slate-500"
        }
        ${className}
      `}
    >
      {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
    </button>
  );
}