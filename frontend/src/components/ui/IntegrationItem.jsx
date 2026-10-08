import React from "react";

const IntegrationItem = ({ item }) => {
  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <span className="truncate">{item.label}</span>

      {item.needsReauth && (
        <span
          className="ml-auto shrink-0 text-[8px] font-black uppercase italic text-orange-500"
          title={item.status || "Expired"}
        >
          {item.status || "Expired"}
        </span>
      )}
    </div>
  );
};

export default IntegrationItem;