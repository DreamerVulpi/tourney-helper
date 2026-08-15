import React, { useState, useRef } from "react";
import {
  Send,
  Users
} from "lucide-react";
import { getThemeClasses } from "../utils/theme/SidePanel/themes";
import { NavItem } from "../components/SidePanel/navItem";

const SidePanel = ({
  theme,
  activeTab,
  setActiveTab,
  locale,
  collapsed,
  setCollapsed,
  setIsHovered,
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

  return (
    <nav
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative ${
        collapsed
          ? "w-[clamp(72px,6.5vw,96px)]"
          : "w-[clamp(260px,15vw,320px)]"
      } border-r flex flex-col p-4 shrink-0 transition-[width] duration-300 h-screen ${
        themeClasses.navPanel
      }`}
    >
      <div className="space-y-1">
        <NavItem
          icon={<Send size={20} />}
          label={locale.NotificationSystemLabel}
          collapsed={collapsed}
          active={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
          themeClasses={themeClasses}
        />

        <NavItem
          icon={<Users size={20} />}
          label={locale.DatabaseLabel}
          collapsed={collapsed}
          active={activeTab === "database"}
          onClick={() => setActiveTab("database")}
          themeClasses={themeClasses}
        />
      </div>
    </nav>
  );
};

export default SidePanel;