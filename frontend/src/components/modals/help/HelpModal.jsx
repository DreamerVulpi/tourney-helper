import React, { useState, useEffect } from "react";
import { Modal } from "../Modal.jsx";
import { HelpCircle } from "lucide-react";
import { OpenURL } from "../../../../wailsjs/go/application/App.js"
import  NotificatonSystemHelpPage  from "./NotificationSystemHelpPage.jsx"  
import  DatabaseHelpPage  from "./DatabaseHelpPage.jsx"  
import WidgetBracketHelpPage from "./WidgetBracketHelpPage.jsx";
import IntegrationsHelpPage from "./IntegrationsHelpPage.jsx";
import ProfilesHelpPage from "./ProfilesHelpPage.jsx";

const renderHelpPage = (locale, activeTab, themeClasses) => {
  switch (activeTab) {
    case "notifications":
      return NotificatonSystemHelpPage(locale.HelpPageNotificationSystem, themeClasses);
    case "dbPlayers":
      return DatabaseHelpPage(locale.HelpPageDatabase, themeClasses);
    case "widgetBracket":
      return WidgetBracketHelpPage(locale.HelpPageWidgetBracket, themeClasses);
    case "integrations":
      return IntegrationsHelpPage(locale.HelpPageIntegrations, themeClasses);
    case "profiles":
      return ProfilesHelpPage(locale.HelpPageProfiles, themeClasses);
    default:
      return null;
  }
};

const HelpModal = ({
  isOpen,
  onClose,
  locale,
  themeClasses,
  activeTab,
}) => {

  if (!isOpen) return null;

  const content = (
    <div className={`p-6 max-h-[70vh] overflow-y-auto space-y-6`}>
        {renderHelpPage(locale, activeTab, themeClasses)}
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        locale.Title
      }
      icon={
        HelpCircle
      }
      iconColor={
        "blue"
      }
      children={content}
      themeClasses={themeClasses}
      width={"max-w-7xl"}
    />
  );
};

export default HelpModal;
