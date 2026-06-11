import React from "react";

const PanelTemplate = ({ 
  children, 
  themeClasses, 
  needToBlock = false 
}) => {
  return (
    <div
      className={`w-full h-full flex flex-col font-sans transition-colors duration-500 ${themeClasses.bg}`}
    >
      <div className="w-full h-full relative flex flex-col flex-1 animate-in fade-in duration-500">
        <div
          className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden w-full h-full flex flex-col flex-1 shadow-2xl ${themeClasses.card} ${
            needToBlock ? "opacity-40 pointer-events-none" : "opacity-100"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PanelTemplate;