import React from "react";

const PanelTemplate = ({ 
  children, 
  themeClasses, 
  needToBlock = false,
  exceptionElement = null
}) => {
  return (
    <div
      className={`w-full h-full flex flex-col font-sans transition-colors duration-500 ${themeClasses.bg}`}
    >
      <div className="w-full h-full relative flex flex-col flex-1 duration-500">
        <div
          className={`p-8 rounded-[2.5rem] border  relative overflow-hidden w-full h-full flex flex-col flex-1 shadow-2xl ${themeClasses.card}`}
        >
          <div 
            className={`w-full h-full flex flex-col flex-1  duration-300 ${
              needToBlock ? "opacity-40 pointer-events-none select-none" : "opacity-100"
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