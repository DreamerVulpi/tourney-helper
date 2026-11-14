import React from "react";
import { Search } from "lucide-react";
import { EmptyState } from "./EmptyState";

function TableBodyBase({
  players,
  columns,
  locale,
  onRowClick,
  rowClassName,
  rowKey,
}) {
  const totalSize = columns.reduce(
    (sum, column) => sum + column.size,
    0
  );

  const getRowKey = (player, index) => {
    if (typeof rowKey === "function") return rowKey(player, index);
    return player.id ?? index;
  };

  return (
    <tbody>
      {players.length > 0 ? (
        players.map((player, index) => (
          <tr
            key={getRowKey(player, index)}
            onClick={onRowClick ? () => onRowClick(player) : undefined}
            className={`
              hover:bg-blue-600/5
              transition-colors
              align-middle
              ${onRowClick ? "cursor-pointer" : ""}
              ${rowClassName ? rowClassName(player) : ""}
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
            <td colSpan={columns.length} className="p-12 text-center">
                <EmptyState
                    icon={Search}
                    title={locale.Table.NoData}
                    description={locale.Table.NoDataAccordingFilters}
                />
            </td>
        </tr>
      )}
    </tbody>
  );
}

export const TableBody = React.memo(TableBodyBase);