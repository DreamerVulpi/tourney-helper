import React, { useState } from "react";
import { X, Copy, Check, FileUp, AlertTriangle } from "lucide-react";

const ImportFileModal = ({ isOpen, onClose, onConfirm, filePath, fileType, theme = 'dark', activeFilter = 'all', locale }) => {
  if (!isOpen || !filePath) return null;

  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';
  const isBanImport = activeFilter === "banned";

  const defaultTemplate = `{
  "MessenagerLogin": "",
  "MessenagerName": "",
  "TournamentPlatformName": "",
  "GameName": "",
  "GameNickname": "",
  "GameID": "",
  "Locale": ""
}`;

  const banListTemplate = `{
  "MessenagerLogin": "",
  "MessenagerName": "",
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Не удалось скопировать шаблон: ", err);
    }
  };

  // Извлекаем чистое имя файла из полного пути для отображения в интерфейсе
  const fileName = filePath.split(/[/\\]/).pop();
  const isFromCsv = fileType === "csv";
 
  const typeStr = isFromCsv ? "CSV" : "JSON";
  const fileFormat = isBanImport
    ? (locale.FileBanFormat).replace("%v", typeStr)
    : (locale.FileFormat).replace("%v", typeStr);

  const labelClasses = `block text-[10px] font-black uppercase tracking-widest mb-2 ${
    isDark ? 'text-slate-500' : 'text-slate-400'
  }`;

  const parts = locale.DescriptionCSV.split("%v");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${
        isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isBanImport ? 'bg-red-600/20' : 'bg-blue-600/20'}`}>
              <FileUp size={18} className={isBanImport ? 'text-red-500' : 'text-blue-500'} />
            </div>
            <h2 className={`text-sm font-black uppercase italic tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {isBanImport ? locale.BanTitle : locale.Title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all hover:bg-red-500/10 text-slate-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {locale.DescriptionImport}
          </p>

          {/* Информационная плашка параметров */}
          <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
            isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between gap-4">
              <span className="opacity-50 min-w-[80px]">{locale.NameFile}</span>
              <span className="font-bold truncate text-right">{fileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50">{locale.TypeFile}</span>
              <span className={`font-bold ${isBanImport ? 'text-red-500' : 'text-blue-500'}`}>{fileFormat}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50">{locale.TargetRegistry}</span>
              <span className={`font-bold uppercase ${isBanImport ? 'text-red-400' : 'text-green-500'}`}>
                {isBanImport ? locale.TargetBanList : locale.TargetDatabase}
              </span>
            </div>
          </div>

          {/* Информационные подсказки по форматам */}
          {isFromCsv ? (
            <div className={`flex flex-col items-center text-center p-5 rounded-xl border ${
              isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-amber-500/[0.02] border-amber-200 text-amber-700'
            }`}>
              <AlertTriangle size={24} className="mb-2 text-amber-500" />
              <span className="font-black block uppercase tracking-wide text-[10px] mb-1">{locale.RequirementsCSV}</span>
              <p className="text-[11px] font-semibold leading-relaxed max-w-sm">
                {parts[0]} <a href="https://start.gg" target="_blank" rel="noopener noreferrer" className="underline font-bold">start.gg</a> {parts[1]}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`flex flex-col items-center text-center p-4 rounded-xl border ${
                isDark ? 'bg-blue-500/5 border-blue-500/20 text-blue-400' : 'bg-blue-500/[0.02] border-blue-200 text-blue-700'
              }`}>
                <p className="text-[11px] font-semibold leading-relaxed">
                  {locale.DescriptionJSON}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={labelClasses}>{isBanImport ? locale.SchemaFieldsBanJsonLabel : locale.SchemaFieldsJSONLabel}</label>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase border transition-all ${
                      copied ? 'bg-green-600/10 border-green-500/30 text-green-500' : isDark ? 'bg-white/5 border-white/5 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {copied ? <><Check size={10} /> {locale.SchemaCopiedButtonLabel}</> : <><Copy size={10} /> {locale.SchemaCopyButtonLabel}</>}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={jsonTemplate}
                  className={`w-full h-32 p-3 rounded-xl font-mono text-[11px] leading-relaxed resize-none border focus:outline-none custom-scrollbar ${
                    isDark ? 'bg-transparent border-white/10 text-slate-300' : 'bg-transparent border-slate-200 text-slate-700'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <button 
            onClick={() => onConfirm(filePath)}
            className={`w-full flex items-center justify-center gap-3 h-[56px] rounded-xl font-black uppercase italic tracking-wider transition-all text-white ${
              isBanImport ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            <Check size={18} />
            {isBanImport ? locale.StartImportBanListButtonLabel : locale.StartImportButtonLabel}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImportFileModal;