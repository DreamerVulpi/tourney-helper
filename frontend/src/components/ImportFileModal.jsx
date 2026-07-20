import React, { useState } from "react";
import {
  X,
  Save,
  Copy,
  Check,
  FileUp,
  FileText,
  AlertTriangle,
  FileWarning,
} from "lucide-react";
import { Modal } from "../components/modals/Modal.jsx";
import { Field } from "./ui/Field.jsx";
import { MessageBox } from "./modals/MessageBox.jsx";
import { CopyButton } from "./ui/CopyButton.jsx";
import { useClipboard } from "../hooks/useClipboard.jsx";

const ImportFileModal = ({
  isOpen,
  onClose,
  onConfirm,
  filePath,
  fileType,
  theme = "dark",
  activeFilter = "all",
  locale,
  themeClasses,
  loading = false,
}) => {
  if (!isOpen || !filePath) return null;

  const isDark = theme === "dark";
  const isBanImport = activeFilter === "banned";

  const defaultTemplate = `{
  "MessengerLogin": "",
  "MessengerName": "",
  "TournamentPlatformName": "",
  "GameName": "",
  "GameNickname": "",
  "GameID": "",
  "Locale": ""
}`;

  const banListTemplate = `{
  "MessengerLogin": "",
  "MessengerName": "",
  "GameName": "",
  "GameNickname": "",
  "GameID": "",
  "Locale": "",
  "TypeBan": "other",
  "Reason": "",
  "Duration": 30,
  "Unit": "days",
  "IsPermanent": false
}`;

  const jsonTemplate = isBanImport ? banListTemplate : defaultTemplate;

  const fileName = filePath.split(/[/\\]/).pop();
  const isFromCsv = fileType === "csv";

  const typeStr = isFromCsv ? "CSV" : "JSON";
  const fileFormat = isBanImport
    ? locale.FileBanFormat.replace("%v", typeStr)
    : locale.FileFormat.replace("%v", typeStr);

  const labelClasses = `block text-[10px] font-black uppercase tracking-widest mb-2 ${
    isDark ? "text-slate-500" : "text-slate-400"
  }`;

  const partsMsgCSV = locale.DescriptionCSV.split("%v");
  const { copied, copy } = useClipboard();

  const footer = (
    <button
      onClick={() => onConfirm(filePath)}
      disabled={loading}
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

        ${
          isBanImport
            ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/10"
            : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/10"
        }

        ${loading ? "opacity-50 cursor-not-allowed" : ""}
        `}
    >
      <Save size={18} />

      {loading
        ? locale.AddModalWindow.ProcessingButtonLabel
        : isBanImport
          ? locale.StartImportBanListButtonLabel
          : locale.StartImportButtonLabel}
    </button>
  );

  const content = (
    <div className={`p-6 max-h-[70vh] overflow-y-auto space-y-6`}>
      <p
        className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}
      >
        {locale.DescriptionImport}
      </p>
      <Field
        variant="mono"
        value={
          <>
            <div className="flex justify-between gap-4">
              <span className="opacity-50">{locale.NameFile}</span>
              <span className="font-bold truncate text-right">{fileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50">{locale.TypeFile}</span>
              <span
                className={`font-bold ${isBanImport ? "text-red-500" : "text-blue-500"}`}
              >
                {fileFormat}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50">{locale.TargetRegistry}</span>
              <span
                className={`font-bold uppercase ${isBanImport ? "text-red-400" : "text-green-500"}`}
              >
                {isBanImport ? locale.TargetBanList : locale.TargetDatabase}
              </span>
            </div>
          </>
        }
        themeClasses={themeClasses}
      />

      <MessageBox
        icon={AlertTriangle}
        iconColor={isDark ? "text-amber-500" : "text-amber-600"}
        borderClass={
          isDark
            ? "bg-amber-500/5 border-amber-500/20"
            : "bg-amber-500/[0.02] border-amber-200"
        }
      >
        {isFromCsv ? (
          <>
            {partsMsgCSV[0]}{" "}
            <a
              href="https://start.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold"
            >
              start.gg
            </a>{" "}
            {partsMsgCSV[1]}
          </>
        ) : (
          locale.DescriptionJSON
        )}
      </MessageBox>

      <div>
        <div className="flex justify-between items-center mb-2 gap-2">
          <Field
            label={isBanImport
            ? locale.SchemaFieldsBanJsonLabel
            : locale.SchemaFieldsJSONLabel}
            variant="textarea"
            value={jsonTemplate}
            themeClasses={themeClasses}
          />
          <CopyButton text={jsonTemplate} iconSize={"1.5rem"}/>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      title={isBanImport ? locale.BanTitle : locale.Title}
      icon={FileUp}
      iconColor={isBanImport ? "red" : "blue"}
      themeClasses={themeClasses}
      footer={footer}
      onClose={onClose}
      children={content}
    ></Modal>
  );
};

export default ImportFileModal;
