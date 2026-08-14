import { Copy, Check } from "lucide-react";
import { useClipboard } from "../../hooks/useClipboard.jsx";

export function CopyButton({ text, timeout = 2000, className = "", iconSize = 12 }) {
  const { copied, copy } = useClipboard(timeout);

  return (
    <button
      onClick={() => copy(text)}
      className={`
        p-1.5
        rounded-md
        
        shrink-0
        ${
          copied
            ? "bg-green-500/20 text-green-500"
            : "hover:bg-blue-500/10 text-slate-500 hover:text-blue-500"
        }
        ${className}
      `}
    >
      {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
    </button>
  );
}