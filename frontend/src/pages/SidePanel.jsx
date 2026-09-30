import { useRef, useState, useMemo } from "react";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  GitFork,
  Send,
  Share,
  SquareUser,
  UserMinus,
  UserPlus,
  Users
} from "lucide-react";
import { getThemeClasses } from "../utils/themeClasses";
import { NavItem } from "../components/SidePanel/navItem";
import { ProgramLogo } from "../components/ui/Logo";
import { useAppStore } from "../store/useAppStore";
import { Modal } from "../components/modals/Modal";
import { Field } from "../components/ui/Field";
import ExpandableAction from "../components/ui/ExpandableAction";


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

  const profileBtnRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);

  const handleProfileClick = () => {
    const rect = profileBtnRef.current?.getBoundingClientRect();
    if (rect) {
      setAnchorRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
    setIsProfileOpen((v) => !v);
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
            active={activeTab === "database"}
            onClick={() => setActiveTab("database")}
            themeClasses={themeClasses}
            status={statusDatabase}
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

        <div ref={profileBtnRef} className="mt-auto space-y-1">
          <NavItem
            icon={<SquareUser size={20} />}
            label={locale.Profile.Title}
            collapsed={sidePanelCollapsed}
            onClick={handleProfileClick}
            themeClasses={themeClasses}
            showStatus={false}
          />
        </div>

        <Modal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          title={locale.Profile.Title}
          icon={SquareUser}
          iconColor="blue"
          themeClasses={themeClasses}
          position="anchored"
          overlay={false}
          anchorRect={anchorRect}
          placement="top"
          offset={10}
          width="max-w-68"
          footer={
            <div className="flex items-center justify-center gap-4">
              <ExpandableAction
                icon={<UserPlus size={20} />}
                collapsedClassName={"bg-blue-600 text-white"}
                collapsedWidth={"36px"}
                width={"80px"}
                items={[
                  {
                    id: "add",
                    label: locale.Profile.Add,
                    flex: 1,
                    className: `text-white ${"bg-blue-700 hover:bg-blue-500"}`,
                  },
                ]}
              />
              <ExpandableAction
                icon={<UserMinus size={20} />}
                collapsedClassName={"bg-red-600 text-white border border-red-500/30"}
                collapsedWidth={"36px"}
                width={"80px"}
                items={[
                  {
                    id: "delete",
                    label: locale.Profile.Delete,
                    flex: 1,
                    className: `text-white ${"bg-red-700 hover:bg-red-600"}`,
                  },
                ]}
              />
              <ExpandableAction
                icon={<Share size={20} />}
                collapsedClassName={"bg-amber-600 text-white border border-amber-500/30"}
                collapsedWidth={"36px"}
                width={"80px"}
                items={[
                  {
                    id: "share",
                    label: locale.Profile.Share,
                    flex: 1,
                    className: `text-white ${"bg-red-700 hover:bg-amber-600"}`,
                  },
                ]}
              />
            </div>
          }
        >
          <div className="p-4 space-y-2">
            <Field
              variant="combobox"
              height="2.5rem"
              value={"Tekken Club Klee"}
              themeClasses={themeClasses}
            />
            
          </div>
        </Modal>
      </nav>
  );
};

export default SidePanel;