import React from "react";

const PanelTemplate = ({
  children,
  themeClasses,
  needToBlock = false,
  exceptionElement = null,
}) => {
  return (
    <div
      className={`w-full h-full min-h-0 flex flex-col font-sans transition-colors duration-500 ${themeClasses.bg}`}
    >
      <div className="w-full flex-1 min-h-0 relative flex flex-col duration-500">
        <div
          className={`p-8 rounded-[2.5rem] border relative overflow-hidden w-full flex-1 min-h-0 flex flex-col shadow-2xl ${themeClasses.card}`}
        >
          <div
            className={`w-full flex-1 min-h-0 flex flex-col duration-300 ${
              needToBlock
                ? "opacity-40 pointer-events-none select-none"
                : "opacity-100"
            }`}
          >
            {children}
          </div>

          {exceptionElement}
        </div>
      </div>
    </div>
  );
};

export default PanelTemplate;