import React, { useState } from "react";
import { 
  Trophy, 
  Send,
  Users,
  Monitor,
  ShieldCheck,
  Settings,
  LayoutGrid
} from "lucide-react";
import { getThemeClasses } from "../utils/theme/SidePanel/themes";
import { NavItem } from "../components/SidePanel/navItem";

const SidePanel = ({
  theme, 
  activeTab, 
  setActiveTab, 
  locale,
}) => {
  const themeClasses = getThemeClasses(theme);
  return (
    <nav
      className={`w-20 lg:w-72 border-r flex flex-col p-4 shrink-0 transition-colors h-screen ${
        themeClasses.navPanel
      }`}
    >
      <div className="space-y-1">
        <NavItem
          icon={<Send size={20} />}
          label= {locale.NotificationSystemLabel}
          active={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
          themeClasses={themeClasses}
        />
        <NavItem
          icon={<Users size={20} />}
          label={locale.DatabaseLabel}
          active={activeTab === "database"}
          onClick={() => setActiveTab("database")}
          themeClasses={themeClasses}
        />
        
        {/* In future updates */}
        {/* <NavItem
          icon={<Trophy size={20} />}
          label={locale.WidgetOfBracketLabel}
          active={activeTab === "bracket"}
          onClick={() => setActiveTab("bracket")}
          themeClasses={themeClasses}
        />
        <NavItem
          icon={<Monitor size={20} />}
          label={locale.WidgetOfScoreboardLabel}
          active={activeTab === "scoreboard"}
          onClick={() => setActiveTab("scoreboard")}
          themeClasses={themeClasses}
        /> */}
      </div>

      {locale.VersionLabel} 0.3.0
    </nav>
  );
};

export default SidePanel;
