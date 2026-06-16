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
      <div className="w-full h-full relative flex flex-col flex-1 animate-in fade-in duration-500">
        <div
          className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden w-full h-full flex flex-col flex-1 shadow-2xl ${themeClasses.card}`}
        >
          <div 
            className={`w-full h-full flex flex-col flex-1 transition-all duration-300 ${
              needToBlock ? "opacity-40 pointer-events-none select-none" : "opacity-100"
            }`}
          >
            {children}
          </div>

          {exceptionElement && (
            <div className="absolute bottom-8 right-8 z-50">
              {exceptionElement}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PanelTemplate;