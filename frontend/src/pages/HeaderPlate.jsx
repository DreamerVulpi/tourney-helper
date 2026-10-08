import { useAppStore } from "../store/useAppStore";
import { getThemeClasses as getAppThemeClasses } from "../utils/themeClasses.jsx";
import { getThemeClasses  as getHeaderThemeClasses } from "../utils/theme/HeaderPlate/themes";
import { useThemeClasses } from "../hooks/App/useThemeClasses"
import { useState, useEffect, useMemo } from "react";

import {
  LanguagesIcon,
  Sun,
  Moon,
  HelpCircle,
  Info,
  UserCog,
  Mail,
  Trophy,
  Tag,
  Link2,
} from "lucide-react";

import { createThemeChanger } from "../utils/changeTheme";
import { Field } from "../components/ui/Field.jsx";
import AboutModal from "../components/modals/AboutModal.jsx"
import HelpModal from "../components/modals/help/HelpModal.jsx"
import UpdateModal from "../components/modals/UpdateModal.jsx"
import ProgressModal from "../components/modals/ProgressModal.jsx";
import { useAuthorizedIntegrations } from "../hooks/App/useAuthorizedIntegrations.jsx";
import { filterValidSelection, getAllBusyIds } from "../utils/integrations";
import IntegrationItem from "../components/ui/IntegrationItem"

const HeaderPlate = ({
  locale,
  updateConfig,
  updateInfo,
  check,
  handleInstallUpdate,
  updateProgressOpen,
  updateStatus,
  updateMessage,
  updateProgress,
  setUpdateProgressOpen,
  setUpdateStatus,
  setUpdateMessage,
  setUpdateProgress,
}) => {
  // ---- store ----
  const theme        = useAppStore((s) => s.theme);
  const setTheme     = useAppStore((s) => s.setTheme);
  const lang         = useAppStore((s) => s.lang);
  const setLang      = useAppStore((s) => s.setLang);
  const activeTab    = useAppStore((s) => s.activeTab);
  const activeModal  = useAppStore((s) => s.activeModal);
  const setActiveModal = useAppStore((s) => s.setActiveModal);

  const settings      = useAppStore((s) => s.settings);
  const selections = useAppStore((s) => s.integrationsSelections);
  const setSelection = useAppStore((s) => s.setSelection);

  const themeClasses = useThemeClasses(getAppThemeClasses)
  const headerThemeClasses = useThemeClasses(getHeaderThemeClasses);

  const tournamentItems = useAuthorizedIntegrations({ category: "tournament" });
  const deliveryItems  = useAuthorizedIntegrations({ category: "delivery"  });

  // Function for change theme & save to configuration of programm
  const changeTheme = createThemeChanger(theme, setTheme, updateConfig);

  // все ID, занятые другими полями/табами, кроме текущего
 const itemsByField = useMemo(() => {
  const buildFor = (fieldKey, baseItems) => {
    const busy = getAllBusyIds(selections, activeTab, fieldKey);
    const current = selections?.[activeTab]?.[fieldKey] || [];
    const filtered = baseItems.filter(
      (it) => !busy.has(it.id) || current.includes(it.id)
    );

    console.log(
      "[HP] buildFor | activeTab:", activeTab,
      "| fieldKey:", fieldKey,
      "| busy:", [...busy],
      "| current:", current,
      "| allItems:", baseItems.map((it) => it.id),
      "| filtered:", filtered.map((it) => it.id)
    );

    return filtered;
  };

  return {
    tourney:  buildFor("tourney",  tournamentItems),
    delivery: buildFor("delivery", deliveryItems),
  };
}, [selections, activeTab, tournamentItems, deliveryItems]);

  const TAB_CLIENT_CONFIG = useMemo(() => ({
    notifications: [
      {
        fieldKey: "tourney",
        label: locale.MultiSelectClient.TourneyLabel,
        labelWidth: "6rem",
        items: itemsByField.tourney,
        icon: Trophy,
        maxVisible: 2,
        single: true,
      },
      {
        fieldKey: "delivery",
        label: locale.MultiSelectClient.DeliveryMethodLabel,
        labelWidth: "5rem",
        items: itemsByField.delivery,
        icon: Mail,
        maxVisible: 2,
        single: false,
      },
    ],

    dbPlayers: [
      {
        fieldKey: "tourney",
        label: locale.MultiSelectClient.TourneyLabel,
        labelWidth: "6rem",
        items: itemsByField.tourney,
        icon: Trophy,
        maxVisible: 2,
        single: false,
      },
    ],

    widgetBracket: [
      {
        fieldKey: "tourney",
        label: locale.MultiSelectClient.TourneyLabel,
        labelWidth: "6rem",
        items: itemsByField.tourney,
        icon: Trophy,
        maxVisible: 2,
        single: false,
      },
    ],
  }), [locale, itemsByField]);

  console.log(
  "[HP] render | activeTab:", activeTab,
  "| selections:", JSON.stringify(selections)
);

  return (
    <header
      className={`h-[4rem] flex items-center justify-between px-[1rem] shrink-0 border-b z-50 transition-colors duration-300 ${
        headerThemeClasses.header
      }`}
    >
      <div className="flex items-center gap-[0.5rem]">
        {activeTab &&
          TAB_CLIENT_CONFIG[activeTab] &&
          TAB_CLIENT_CONFIG[activeTab].map((cfg) => {
            const currentValue = selections?.[activeTab]?.[cfg.fieldKey] || [];
            return (
              <Field
                key={cfg.fieldKey}
                variant="multiselect"
                label={cfg.label}
                labelPosition="left"
                labelWidth={cfg.labelWidth}
                value={currentValue}
                onChange={(ids) => {
                  console.log(
                    "[HP] onChange | activeTab:", activeTab,
                    "| fieldKey:", cfg.fieldKey,
                    "| ids:", ids,
                    "| types:", Array.isArray(ids) ? ids.map((x) => typeof x) : typeof ids
                  );
                  setSelection(activeTab, cfg.fieldKey, ids);
                }}
                items={cfg.items}
                width="21rem"
                icon={cfg.icon}
                placeholder={locale.MultiSelectClient.ChooseClient}
                searchable
                maxVisible={cfg.maxVisible}
                single={cfg.single}
                themeClasses={themeClasses}
                locale={locale.MultiSelectClient}
                renderItem={(item) => <IntegrationItem item={item} />}
              />
            );
          })}
      </div>

      <div className="flex items-center gap-[0.5rem]">
        <Field
          variant="select"
          value={lang}
          width={"6.1rem"}
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

        <div
          className={`flex items-center gap-[0.5rem] pl-[0.5rem] border-l h-[1.5rem] text-slate-500 ${
            headerThemeClasses.divider
          }`}
        >
          <Field
            variant="button"
            width="6.2rem"
            icon={HelpCircle}
            labelButton={locale.Help.Label}
            themeClasses={themeClasses}
            onClick={()=> setActiveModal("help")}
          />
          <Field
            variant="button"
            icon={Info}
            width="6.2rem"
            labelButton={locale.About.Label}
            themeClasses={themeClasses}
            onClick={()=> setActiveModal("about")}
          />
        </div>
      </div>
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
