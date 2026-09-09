import React, { useState } from "react";

import {
  LanguagesIcon,
  Sun,
  Moon,
  HelpCircle,
  Info,
  UserCog,
  Trophy,
  Mail,
} from "lucide-react";
import { getThemeClasses } from "../utils/theme/HeaderPlate/themes.jsx";
import { createThemeChanger } from "../utils/changeTheme";
import { Field } from "../components/ui/Field.jsx";
import AboutModal from "../components/modals/AboutModal.jsx"
import HelpModal from "../components/modals/help/HelpModal.jsx"
import UpdateModal from "../components/modals/UpdateModal.jsx"
import ProgressModal from "../components/modals/ProgressModal.jsx";
import AuthorizationModal from "../components/modals/AuthorizationModal.jsx";

const HeaderPlate = ({
  theme,
  setTheme,
  lang,
  setLang,
  locale,
  updateInfo,
  check,
  themeClasses,
  activeModal,
  activeTab,
  authStatus,
  setAuthStatus,
  activeAuthorizationSettings,
  activeTournamentPlatform,
  setActiveAuthorizationSettings,
  setActiveModal,
  activeDeliveryMethod,
  setActiveDeliveryMethod,
  settings,
  handleInstallUpdate,
  updateProgressOpen,
  updateStatus,
  updateMessage,
  updateProgress,
  setUpdateProgressOpen,
  setUpdateStatus,
  setUpdateMessage,
  setUpdateProgress,
  updateConfig,
  tourneyCfg,
  systemCfg,
}) => {
  // Function for change theme & save to configuration of programm
  const changeTheme = createThemeChanger(theme, setTheme, updateConfig);
  // Details of theme for this page
  const headerThemeClasses = getThemeClasses(theme);

 
  return (
    <header
      className={`h-[4rem] flex items-center justify-between px-[1.5rem] shrink-0 border-b z-50 transition-colors duration-300 ${
        headerThemeClasses.header
      }`}
    >
      <div className="flex items-center gap-[1.5rem]">
        <Field
            variant="button"
            width="10rem"
            icon={UserCog}
            labelButton={locale.Authorization.Label}
            themeClasses={themeClasses}
            onClick={()=> setActiveModal("authorization")}
          />
        {/* { activeTab === "notifications" && (
          <>
            <Field
              variant="select"
              labelPosition="left"
              labelWidth={"11rem"}
              value={"startgg"}
              items={[
                  {
                    label: "Start.gg",
                    value: "startgg",
                  },
                ]}
              width={"22rem"}
              icon={Trophy}
              label={"Tournament platform"}
              themeClasses={headerThemeClasses}
            />
            <Field
                variant="select"
                labelPosition="left"
                labelWidth={"8rem"}
                value={"Discord"}
                width={"18rem"}
                items={[
                  {
                    label: "Discord",
                    value: "discord",
                  },
                ]}
                icon={Mail}
                label={"Delivery method"}
                themeClasses={headerThemeClasses}
            />
          </>
        )} */}
      </div>

      <div className="flex items-center gap-[1rem]">
        {/* Selector language */}
        <Field
          variant="select"
          value={lang}
          width={"6.5rem"}
          icon = {LanguagesIcon}
          themeClasses={headerThemeClasses}
          items={[
              {
                label: "RU",
                value: "RU",
              },
              {
                label: "EN",
                value: "EN",
              }
            ]}
          onChange={(value) => {
              setLang(value);
              updateConfig?.("settings", {
                language: value,
              });
            }}
        />

        {/* Theme switcher */}
        <button
          onClick={changeTheme}
          className={`flex items-center gap-[0.25rem] p-[0.25rem] rounded-full border  duration-300 ${
            headerThemeClasses.themeButton
          }`}
        >
          <div
            className={`p-[0.25rem] rounded-full  ${
              headerThemeClasses.sunIcon
            }`}
          >
            <Sun style={{ width: "0.875rem", height: "0.875rem" }} />
          </div>
          <div
            className={`p-[0.25rem] rounded-full  ${
              headerThemeClasses.moonIcon
            }`}
          >
            <Moon style={{ width: "0.875rem", height: "0.875rem" }} />
          </div>
        </button>

        {/* Extra buttons */}
        <div
          className={`flex items-center gap-[1rem] pl-[1rem] border-l h-[1.5rem] text-slate-500 ${
            headerThemeClasses.divider
          }`}
        >
          <Field
            variant="button"
            width="100px"
            icon={HelpCircle}
            labelButton={locale.Help.Label}
            themeClasses={themeClasses}
            onClick={()=> setActiveModal("help")}
          />
          <Field
            variant="button"
            icon={Info}
            width="100px"
            labelButton={locale.About.Label}
            themeClasses={themeClasses}
            onClick={()=> setActiveModal("about")}
          />
        </div>
      </div>
    <AuthorizationModal
      isOpen={activeModal === "authorization"}
      onClose={() => {
        setActiveModal(null);
      }}
      locale={locale.Authorization}
      themeClasses={themeClasses}

      systemCfg={systemCfg}
      tourneyCfg={tourneyCfg}
      updateConfig={updateConfig}

      activeAuthorizationSettings={activeAuthorizationSettings}
      setActiveAuthorizationSettings={setActiveAuthorizationSettings}
      
      activeDeliveryMethod={activeDeliveryMethod}
      setActiveDeliveryMethod={setActiveDeliveryMethod}

      activeTournamentPlatform={activeTournamentPlatform}
      setActiveTournamentPlatform={setActiveAuthorizationSettings}

      authStatus={authStatus}
      setAuthStatus={setAuthStatus}
      
    />
    <AboutModal
      isOpen={activeModal === "about"}
      locale={locale.About}
      themeClasses={themeClasses}
      onClose={() => {
          setActiveModal(null);
      }}
      settings={settings}
      updateInfo={updateInfo}
      setActiveModal={setActiveModal}
      check={check}
    />
    <HelpModal
      activeTab={activeTab}
      isOpen={activeModal === "help"}
      locale={locale.Help}
      themeClasses={themeClasses}
      onClose={() => {
          setActiveModal(null);
      }}
    />
    <UpdateModal 
      isOpen={activeModal === "update"}
      locale={locale.Update}
      themeClasses={themeClasses}
      onClose={() => {
          setActiveModal(null);
      }}
      lang={lang}
      updateInfo={updateInfo}
      check={check}
      updateConfig={updateConfig}
      settings={settings}
      onInstallUpdate={handleInstallUpdate}
    />
    <ProgressModal
        isOpen={updateProgressOpen}
        status={updateStatus}
        progress={updateProgress}
        message={updateMessage}
        title={locale.Update.Title}
        themeClasses={themeClasses}
        onClose={() => {
          setUpdateProgressOpen(false);
          setUpdateStatus("idle");
          setUpdateMessage("");
          setUpdateProgress(0);
        }}
    />
    </header>
  );
};

export default HeaderPlate;
