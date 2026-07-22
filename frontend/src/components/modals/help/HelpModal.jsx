import React, { useState, useEffect } from "react";
import { Modal } from "../Modal.jsx";
import { HelpCircle } from "lucide-react";
import { OpenURL } from "../../../../wailsjs/go/application/App.js"
import  NotificatonSystemHelpPage  from "./NotificationSystemHelpPage.jsx"  
import  DatabaseHelpPage  from "./DatabaseHelpPage.jsx"  

const HelpModal = ({
  isOpen,
  onClose,
  locale,
  themeClasses,
  activeTab,
}) => {

  if (!isOpen) return null;

  const footer = (
    <button
      className={`
        w-full
        flex
        items-center
        justify-center
        gap-3
        h-[56px]
        rounded-xl
        font-black
        uppercase
        italic
        tracking-wider
        transition-all
        text-white

        bg-blue-600 hover:bg-blue-500
        }
        `}
      onClick={onClose}
    >
      {locale.CloseButtonLabel}
    </button>
  );

  const content = (
    <div className={`p-6 max-h-[70vh] overflow-y-auto space-y-6`}>
        {
            activeTab === "notifications" ? NotificatonSystemHelpPage(locale.HelpPageNotificationSystem, themeClasses)
            : activeTab === "database" ? DatabaseHelpPage(locale.HelpPageDatabase, themeClasses) : ""
        }
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
      footer={footer}
      width={"max-w-7xl"}
    />
  );
};

export default HelpModal;
