import React from "react";

function TableHeaderBase({ columns, theme }) {
  const totalSize = columns.reduce(
    (sum, column) => sum + column.size,
    0
  );

  return (
    <thead>
      <tr
        className={`${
          theme === "dark"
            ? "text-slate-400"
            : "text-slate-600"
        } uppercase font-black italic`}
      >
        {columns.map((column) => (
          <th
            key={column.key}
            className={`p-1 ${column.thClassName || ""}`}
            style={{
              width: `${(column.size / totalSize) * 100}%`,
            }}
          >
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export const TableHeader = React.memo(TableHeaderBase);