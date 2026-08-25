import React from "react";
import { Search } from "lucide-react";

function TableBodyBase({
  players,
  columns,
  locale,
}) {
  const totalSize = columns.reduce(
    (sum, column) => sum + column.size,
    0
  );

  return (
    <tbody>
      {players.length > 0 ? (
        players.map((player, index) => (
          <tr
            key={player.id}
            className={`
              hover:bg-blue-600/5
              transition-colors
              align-middle
              ${
                index !== players.length - 1
                  ? "border-b border-white/5"
                  : ""
              }
            `}
          >
            {columns.map((column) => (
              <td
                key={column.key}
                className={`p-1 ${column.tdClassName || ""}`}
                style={{
                  width: `${(column.size / totalSize) * 100}%`,
                }}
              >
                {column.render(player)}
              </td>
            ))}
          </tr>
        ))
      ) : (
        <tr>
          <td
            colSpan={columns.length}
            className="p-12 text-center"
          >
            <div className="flex flex-col items-center justify-center py-6">
              <div className="p-4 bg-slate-500/5 border border-slate-500/10 rounded-2xl text-slate-500/40 mb-4 shadow-inner">
                <Search
                  size={32}
                  strokeWidth={1.5}
                  className="animate-pulse"
                />
              </div>

              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1 italic">
                {locale.Table.NoData}
              </h3>

              <p className="text-[10px] text-slate-500 max-w-[250px] leading-relaxed uppercase font-bold">
                {locale.Table.NoDataAccordingFilters}
              </p>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
}

export const TableBody = React.memo(TableBodyBase);