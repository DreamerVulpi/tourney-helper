import React, { useState, useEffect } from "react";
import { Field } from "../ui/Field.jsx";
import { Modal } from "./Modal.jsx";
import { Ban, Book, Bug, Coins, Download, FileQuestionMark, GitBranch, HandCoins, Info, Recycle, RecycleIcon, RotateCcw, Router, Rss, ServerOff, Settings, Upload } from "lucide-react";
import { MessageBox } from "./MessageBox.jsx";
import { useCheckUpdate } from "../../hooks/App/useCheckUpdate.jsx"
import { OpenURL } from "../../../wailsjs/go/application/App.js"
import { ToggleSwitch } from "../ui/ToggleSwitch.jsx";

const UpdateModal = ({
  isOpen,
  onClose,
  locale,
  updateInfo,
  lang,
  themeClasses,
  settings,
  updateConfig,
  currentVersion,
  onInstallUpdate,
}) => {
  if (!isOpen) return null;

  const hasUpdate =
    updateInfo?.Available &&
    settings.IgnoredVersion !== updateInfo?.Latest?.Version;


  const title = hasUpdate
    ? `${locale.Title} ${updateInfo.Latest.Version}`
    : `${locale.Title}`;

  const description = hasUpdate
    ? (
        lang === "RU"
          ? updateInfo.Latest.Description.Russian
          : updateInfo.Latest.Description.English
      )
    : locale.NoUpdateDescription;


  const footerButtonLabel = locale.GetUpdateButtonLabel

  const handleMainAction = () => {
    if (!hasUpdate) {
      onClose();
      return;
    }

    onClose();
    onInstallUpdate();
  };


  const footer = (
    <div className={`grid ${hasUpdate ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
      {hasUpdate && (<>
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
            
            text-white
            bg-blue-600 hover:bg-blue-500
          `}
          onClick={handleMainAction}
        >
          {footerButtonLabel}
        </button>
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
            
            text-white
            bg-orange-600 hover:bg-orange-500
          `}
          onClick={() => {
            updateConfig("settings", {
              ...settings,
              IgnoredVersion: updateInfo?.Latest?.Version,
            });
            onClose();
          }}
        >
          {locale.SkipUpdateButtonLabel}
        </button>
      </>
    )}
    </div>
  );

  const partsNoUpdateDescription = locale.NoUpdateDescription.split("%v")
  const content = (
    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
      {!hasUpdate && (
        <MessageBox
          icon={ServerOff}
          iconColor={"text-blue-500"}
          borderClass={
              "bg-blue-500/5 border-blue-500/20"
            }
        > 
          <>
            <div className="text-blue-500 text-base font-bold text-center mb-2"> {locale.NoUpdateTitle} </div> 
            <div className="mb-4 text-sm">
              {partsNoUpdateDescription[0]}{" "}
              <span
                onClick={()=> OpenURL("https://github.com/DreamerVulpi/tourney-helper/releases")}
                className="font-bold text-blue-500 hover:text-blue-400 underline"
              >
                GitHub
              </span> {" "}
              {partsNoUpdateDescription[2]}
            </div>
          </>
        </MessageBox>
      )}
      {hasUpdate && (
        <>
          <Field
            label={locale.UpdateDescriptionLabel}
            variant="textarea"
            readOnly={true}
            placeholder={locale.NoData}
            value={description}
            themeClasses={themeClasses}
            height="h-[23rem]"
          />
          <ToggleSwitch
            label={locale.DontShowAlertOnStartApplication}
            icon={Ban}
            checked={!settings.CheckUpdatesOnStartUp}
            color="red"
            themeClasses={themeClasses}
            onChange={(value) =>
              updateConfig("settings", {
                ...settings,
                CheckUpdatesOnStartUp: !value,
              })
            }
          />
        </>
      )}
    </div>
  );


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={Router}
      layer={"1000"}
      iconColor="blue"
      children={content}
      themeClasses={themeClasses}
      footer={footer}
    />
  );
};

export default UpdateModal;
