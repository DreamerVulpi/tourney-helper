import { Copy, Check } from "lucide-react";
import { useClipboard } from "../../hooks/useClipboard.jsx";

export function CopyButton({ text, timeout = 2000, className = "" }) {
  const { copied, copy } = useClipboard(timeout);

  return (
    <button
      onClick={() => copy(text)}
      className={`
        p-1.5
        rounded-md
        transition-all
        shrink-0
        ${
          copied
            ? "bg-green-500/20 text-green-500"
            : "hover:bg-blue-500/10 text-slate-500 hover:text-blue-500"
        }
        ${className}
      `}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}