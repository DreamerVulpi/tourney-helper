import { useRef, useMemo } from "react";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  GitFork,
  Send,
  SquareUser,
  UserCog,
  Users
} from "lucide-react";
import { getThemeClasses } from "../utils/themeClasses";
import { NavItem } from "../components/SidePanel/navItem";
import { ProgramLogo } from "../components/ui/Logo";
import { useAppStore } from "../store/useAppStore";
import { SERVICE_STATUS } from "../utils/listStatus";
import { useToolsLocked } from "../hooks/App/useToolsLocked";


const SidePanel = ({ locale, updateConfig }) => {
    // ---- store ----
  const theme       = useAppStore((s) => s.theme);
  const activeTab   = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const sidePanelCollapsed = useAppStore((s) => s.sidePanelCollapsed);
  const setSidePanelCollapsed = useAppStore((s) => s.setSidePanelCollapsed);
  const setIsHovered          = useAppStore((s) => s.setIsSidePanelHovered);

  const statusNotificationSystem = useAppStore((s) => s.statusNotificationSystem);
  const statusDatabase           = useAppStore((s) => s.statusDatabase);
  const statusWidgetBracket      = useAppStore((s) => s.statusWidgetBracket);

  const settings = useAppStore((s) => s.settings);
  const isProfilesLocked = useToolsLocked();
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
  const themeClasses = useMemo(() => getThemeClasses(theme), [theme]);
  const handleSidePanelCollapse = () => {
    const next = !sidePanelCollapsed;

    setSidePanelCollapsed(next);

    updateConfig("settings", {
      ...(settings ?? {}),
      SidePanelCollapsed: next,
    });
  };

  return (
      <nav
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative ${
          sidePanelCollapsed
            ? "w-[clamp(72px,5vw,96px)]"
            : "w-[clamp(255px,15vw,320px)]"
        } border-r flex flex-col p-4 h-full transition-[width] duration-300 ${
          themeClasses.navPanel
        }`}
      >
        {/* Верхняя группа */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <NavItem
              icon={sidePanelCollapsed ? (
                <ArrowRightFromLine size={20} />
              ) : (
                <ArrowLeftFromLine size={20} />
              )}
              collapsed={sidePanelCollapsed}
              themeClasses={themeClasses}
              showStatus={false}
              onClick={handleSidePanelCollapse}
              content={
                <>
                  <ProgramLogo
                    theme={themeClasses}
                    collapsed={sidePanelCollapsed}
                  />
                </>
              }
            />
          </div>

          <NavItem
            icon={<Send size={20} />}
            label={locale.NotificationSystemLabel}
            collapsed={sidePanelCollapsed}
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            themeClasses={themeClasses}
            status={statusNotificationSystem}
          />

          <NavItem
            icon={<Users size={20} />}
            label={locale.DatabaseLabel}
            collapsed={sidePanelCollapsed}
            active={activeTab === "dbPlayers"}
            onClick={() => setActiveTab("dbPlayers")}
            themeClasses={themeClasses}
            showStatus={false}
          />

          <NavItem
            icon={<GitFork size={20} />}
            label={locale.WidgetOfBracketLabel}
            collapsed={sidePanelCollapsed}
            active={activeTab === "widgetBracket"}
            onClick={() => setActiveTab("widgetBracket")}
            themeClasses={themeClasses}
            status={statusWidgetBracket}
          />
        </div>

        <div className="mt-auto space-y-1">
          <NavItem
            icon={<UserCog size={20} />}
            label={locale.IntegrationsLabel}
            collapsed={sidePanelCollapsed}
            active={activeTab === "integrations"}
            onClick={() => setActiveTab("integrations")}
            themeClasses={themeClasses}
            showStatus={false}
          />
          <NavItem
            icon={<SquareUser size={20} />}
            label={locale.ProfilesLabel}
            collapsed={sidePanelCollapsed}
            active={activeTab === "profiles"}
            onClick={() => setActiveTab("profiles")}
            themeClasses={themeClasses}
            showStatus={false}
            disabled={isProfilesLocked}
            lockTooltip={
              isProfilesLocked
                ? locale.ProfilesLockedHint ?? ""
                : undefined
            }
          />
        </div>
      </nav>
  );
};

export default SidePanel;