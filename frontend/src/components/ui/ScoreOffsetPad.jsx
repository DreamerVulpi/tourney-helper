import React, { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

export function ScoreOffsetPad({
  x = 0,
  y = 0,
  max = 24,
  onChange,
  themeClasses,
  resetLabel = "Reset",
}) {
  const padRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const updateFromEvent = (event) => {
    const pad = padRef.current;
    if (!pad) return;

    const rect = pad.getBoundingClientRect();
    const half = Math.min(rect.width, rect.height) / 2;

    let dx = event.clientX - (rect.left + rect.width / 2);
    let dy = event.clientY - (rect.top + rect.height / 2);

    const distance = Math.hypot(dx, dy);
    if (distance > half) {
      dx = (dx / distance) * half;
      dy = (dy / distance) * half;
    }

    const nextX = Math.round((dx / half) * max);
    const nextY = Math.round((-dy / half) * max);
    onChange?.(nextX, nextY);
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
    updateFromEvent(event);
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
    updateFromEvent(event);
  };

  const handlePointerUp = (event) => {
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const left = `${50 + (x / max) * 42}%`;
  const top = `${50 - (y / max) * 42}%`;

  return (
    <div className="flex flex-col items-center gap-2 w-[5rem]">
      <div
        ref={padRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-[5rem] h-[5rem] rounded-xl border overflow-hidden touch-none cursor-crosshair select-none ${
          themeClasses?.field || "bg-slate-900 border-slate-700"
        }`}
      >
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-current/20" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-current/20" />

        <div
          className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 border-2 border-white shadow-lg"
          style={{ left, top }}
        />
      </div>

      <div className="flex w-full items-center justify-center gap-1 text-[9px] font-black uppercase italic opacity-70 whitespace-nowrap">
        <span>X: {x}</span>
        <span>Y: {y}</span>
        <button
          type="button"
          onClick={() => onChange?.(0, 0)}
          title={resetLabel}
          className="p-1 rounded-md hover:bg-white/10 transition-colors"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}

export default ScoreOffsetPad;
