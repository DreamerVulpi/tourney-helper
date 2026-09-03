import React, { useState, useRef } from "react";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  GitFork,
  Send,
  Users
} from "lucide-react";
import { getThemeClasses } from "../utils/theme/SidePanel/themes";
import { NavItem } from "../components/SidePanel/navItem";
import { ProgramLogo } from "../components/ui/Logo";


const SidePanel = ({
  theme,
  activeTab,
  setActiveTab,
  locale,
  collapsed,
  setIsHovered,
  statusNotificationSystem,
  statusDatabase,
  statusWidgetBracket,
  updateConfig,
  settings,
  sidePanelCollapsed,
  setSidePanelCollapsed,
}) => {
  const hoverTimeout = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }

    hoverTimeout.current = setTimeout(() => {
      setIsHovered(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }

    hoverTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 1500);
  };
  const themeClasses = getThemeClasses(theme);
  const handleSidePanelCollapse = () => {
    const next = !sidePanelCollapsed;

    setSidePanelCollapsed(next);

    updateConfig("settings", {
      ...settings,
      SidePanelCollapsed: next,
    });
  };

  function SidePanelToggle({
    collapsed,
    onClick,
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="
          w-6 h-6
          flex items-center justify-center
          rounded-lg
          transition-colors duration-200
          hover:bg-black/10
          dark:hover:bg-white/10
        "
        aria-label={collapsed ? "Expand side panel" : "Collapse side panel"}
      >
        {collapsed ? (
          <ArrowRightFromLine size={20} />
        ) : (
          <ArrowLeftFromLine size={20} />
        )}
      </button>
    );
  }

  return (
    <nav
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative ${
        collapsed
          ? "w-[clamp(72px,6.5vw,96px)]"
          : "w-[clamp(250px,15vw,320px)]"
      } border-r flex flex-col p-4 h-full transition-[width] duration-300 ${
        themeClasses.navPanel
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <NavItem
            icon={collapsed ? (
              <ArrowRightFromLine size={20} />
            ) : (
              <ArrowLeftFromLine size={20} />
            )}
            collapsed={collapsed}
            themeClasses={themeClasses}
            showStatus={false}
            onClick={handleSidePanelCollapse}
            content={
            <> 
              <ProgramLogo
                theme={getThemeClasses(theme)}
                collapsed={collapsed}
              />
            </>}
          />
        </div>
        

        
        
        <NavItem
          icon={<Send size={20} />}
          label={locale.NotificationSystemLabel}
          collapsed={collapsed}
          active={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
          themeClasses={themeClasses}
          status={statusNotificationSystem}
        />

        <NavItem
          icon={<Users size={20} />}
          label={locale.DatabaseLabel}
          collapsed={collapsed}
          active={activeTab === "database"}
          onClick={() => setActiveTab("database")}
          themeClasses={themeClasses}
          status={statusDatabase}
        />
        <NavItem
          icon={<GitFork size={20} />}
          label={locale.WidgetOfBracketLabel}
          collapsed={collapsed}
          active={activeTab === "widgetBracket"}
          onClick={() => setActiveTab("widgetBracket")}
          themeClasses={themeClasses}
          status={statusWidgetBracket}
        />
      </div>
    </nav>
  );
};

export default SidePanel;