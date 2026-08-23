import React, { useState, useEffect } from "react";
import { Field } from "../ui/Field.jsx";
import { Modal } from "../modals/Modal.jsx";
import { Book, Bug, Coins, GitBranch, HandCoins, Info, Recycle, RecycleIcon, RotateCcw, Rss, Settings, Upload } from "lucide-react";
import { MessageBox } from "./MessageBox.jsx";
import { GetVersion, OpenURL } from "../../../wailsjs/go/application/App.js"
import { useCheckUpdate } from "../../hooks/App/useCheckUpdate.jsx"

const AboutModal = ({
  isOpen,
  onClose,
  locale,
  check,
  themeClasses,
  setActiveModal,
}) => {

  if (!isOpen) return null;
  const [version, setVersion] = useState("");
  useEffect(()=> {
    GetVersion()
      .then(setVersion)
      .catch(console.error);
  },[]);

  const content = (
    <div className={`p-6 max-h-[70vh] overflow-y-auto space-y-6`}>
      <MessageBox
        icon={Settings}
        iconColor={"text-blue-500"}
        borderClass={
          "bg-blue-500/5 border-blue-500/20"
        }
      > <>
          <div className="text-blue-500 text-base font-bold text-center mb-2"> TourneyHelper </div> 
          <div className="mb-4 text-sm"> {locale.Description} </div>
          <div className="text-blue-500 text-sm font-bold text-center"> © 2026 DreamerVulpi </div> 
        </>
      </MessageBox>
      <Field
        variant="mono"
        value={
          <>
            <div className="flex text-base justify-between gap-4">
              <span className="opacity-50">{locale.Version}</span>
              <span className="font-bold truncate text-right">{version}</span>
            </div>
            <div className="flex text-base justify-between gap-4">
              <span className="opacity-50">{locale.Developer}</span>
              <span
                onClick={()=> OpenURL("https://github.com/DreamerVulpi")}
                className="font-bold text-blue-500 hover:text-blue-400 underline"
              >
                DreamerVulpi
              </span>
            </div>
            <div className="flex text-base justify-between gap-4">
              <span className="opacity-50">{locale.Frontend}</span>
              <span
                className={`font-bold uppercase text-green-500`}
              >
                Wails (React, Vie.js)
              </span>
            </div>
            <div className="flex text-base justify-between gap-4">
              <span className="opacity-50">{locale.Backend}</span>
              <span
                className={`font-bold uppercase text-green-500`}
              >
                Golang, SQLite
              </span>
            </div>
            <div className="flex text-base justify-between gap-4">
              <span className="opacity-50">{locale.License}</span>
              <span
                className={`font-bold uppercase text-orange-500 hover:text-orange-400 underline`}
                onClick={()=>OpenURL("https://github.com/DreamerVulpi/tourney-helper/blob/master/LICENSE")}
              >
                MIT
              </span>
            </div>
          </>
        }
        themeClasses={themeClasses}
      />
      
      <Field
          variant="button"
          icon={RotateCcw}
          labelButton={locale.CheckUpdates}
          themeClasses={themeClasses}
          onClick={()=> {
            check();
            setActiveModal("update");
          }}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          variant="button"
          icon={Bug}
          labelButton={locale.ReportBug}
          themeClasses={themeClasses}
          onClick={()=> OpenURL("https://github.com/DreamerVulpi/tourney-helper/issues")}
        />
        <Field
          variant="button"
          icon={GitBranch}
          labelButton={"GitHub"}
          themeClasses={themeClasses}
          onClick={()=> OpenURL("https://github.com/DreamerVulpi/tourney-helper")}
        />
        <Field
          variant="button"
          icon={HandCoins}
          labelButton={locale.DonateOnProject}
          themeClasses={themeClasses}
          onClick={()=> OpenURL(locale.DonateLink)}
        />
        <Field
          variant="button"
          icon={Rss}
          labelButton={locale.SubscribeOnProject}
          themeClasses={themeClasses}
          onClick={()=> OpenURL(locale.SubscribeLink)}
        />
      </div>
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
        Info
      }
      iconColor={
        "blue"
      }
      children={content}
      themeClasses={themeClasses}
    />
  );
};

export default AboutModal;
