import React, { useState } from "react";
import { X, Copy, Check, FileUp, AlertTriangle } from "lucide-react";

const ImportJsonModal = ({ isOpen, onClose, onConfirm, jsonData, fileType, theme = 'dark', activeFilter = 'all' }) => {
  if (!isOpen || !jsonData) return null;

  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';
  const isBanImport = activeFilter === "banned";

  // Базовый шаблон для обычных участников
  const defaultTemplate = `{
  "MessenagerLogin": "",
  "MessenagerName": "",
  "TournamentPlatformName": "",
  "GameName": "",
  "GameNickname": "",
  "GameID": "",
  "Locale": ""
}`;

  // Расширенный шаблон для импорта сразу в бан-лист
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

  // Выбираем шаблон в зависимости от того, на какой вкладке запущен импорт
  const jsonTemplate = isBanImport ? banListTemplate : defaultTemplate;

  // Функция для копирования в буфер обмена
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Не удалось скопировать шаблон: ", err);
    }
  };

  // Приводим входящие данные к единому массиву для анализа структур
  const rawItems = Array.isArray(jsonData) ? jsonData : [jsonData];
  
  // Валидатор проверяет структуру. Для бана проверяем также наличие полей бана или базовых ID
  const isValidRecord = (item) => {
    if (!item || typeof item !== "object") return false;
    
    // Базовая проверка: должен быть хотя бы ID или Никнейм
    const hasBaseIdentity = "GameID" in item || "gameId" in item || "GameNickname" in item || "nickname" in item || "MessenagerLogin" in item;
    
    return hasBaseIdentity;
  };

  const recognizedItems = rawItems.filter(isValidRecord);
  const unrecognizedCount = rawItems.length - recognizedItems.length;

  // Определяем формат по пропсу, который передали из DatabasePlate
  const isFromCsv = fileType === "csv";
  
  let fileFormat = isBanImport ? "JSON Бан-лист (Single)" : "JSON Объект (Single)";
  if (Array.isArray(jsonData)) {
    if (isFromCsv) {
      fileFormat = isBanImport ? "CSV Бан-лист (List)" : "CSV Таблица (List)";
    } else {
      fileFormat = isBanImport ? "JSON Бан-лист (List)" : "JSON Массив (List)";
    }
  }

  const labelClasses = `block text-[10px] font-black uppercase tracking-widest mb-2 ${
    isDark ? 'text-slate-500' : 'text-slate-400'
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Задний фон с блюром */}
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
              {isBanImport ? "Обнаружен файл блокировок для импорта" : "Обнаружены данные для импорта"}
            </h2>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:bg-red-500/10 text-slate-500 hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
          
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Файл успешно прочитан. Аналитика структуры входящего {isBanImport ? "бан-листа" : "файла"}:
          </p>

          {/* Информационная плашка */}
          <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
            isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between">
              <span className="opacity-50">Тип данных:</span>
              <span className={`font-bold ${isBanImport ? 'text-red-500' : 'text-blue-500'}`}>{fileFormat}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50">Распознано записей для импорта:</span>
              <span className="font-bold text-green-500">{recognizedItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-50">Количество не распознанных записей:</span>
              <span className={`font-bold ${unrecognizedCount > 0 ? "text-red-500" : "opacity-40"}`}>
                {unrecognizedCount}
              </span>
            </div>
          </div>

          {/* Условный рендеринг блоков подсказок при наличии нераспознанных строк */}
          {unrecognizedCount >= 1 && (
            <>
              {isFromCsv ? (
                /* Обновленный блок предупреждения для CSV файла */
                <div className={`flex flex-col items-center text-center p-5 rounded-xl border ${
                  isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-amber-500/[0.02] border-amber-200 text-amber-700'
                }`}>
                  <AlertTriangle size={32} className="mb-3 animate-pulse text-amber-500" />
                  <span className="font-black block uppercase tracking-wide text-[10px] mb-2">Внимание!</span>
                  <p className="text-xs font-semibold leading-relaxed max-w-sm">
                    Поддерживается импорт CSV файлов, экспортированных исключительно с платформы{" "}
                    <a 
                      href="https://start.gg" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="underline font-bold hover:text-amber-400 transition-colors inline-flex items-center gap-0.5"
                    >
                      start.gg
                    </a>. 
                    Проверьте структуру колонок и повторите попытку.
                  </p>
                </div>
              ) : (
                /* Обновленный блок предупреждения для JSON файла */
                <div className="space-y-4">
                  <div className={`flex flex-col items-center text-center p-5 rounded-xl border ${
                    isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-amber-500/[0.02] border-amber-200 text-amber-700'
                  }`}>
                    <AlertTriangle size={32} className="mb-3 animate-pulse text-amber-500" />
                    <span className="font-black block uppercase tracking-wide text-[10px] mb-2">Внимание!</span>
                    <p className="text-xs font-semibold leading-relaxed max-w-sm">
                      Программа поддерживает файлы, реализованные строго по ниже описанному шаблону. Проверьте имена полей (ключей).
                    </p>
                  </div>

                  {/* Сам шаблон и кнопка копирования */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className={labelClasses}>
                        {isBanImport ? "JSON Шаблон Бан-Листа" : "JSON шаблон структуры"}
                      </label>
                      
                      <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase italic border transition-all ${
                          copied 
                            ? 'bg-green-600/10 border-green-500/30 text-green-500' 
                            : isDark
                              ? 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check size={10} /> Копирование успешно
                          </>
                        ) : (
                          <>
                            <Copy size={10} /> Скопировать шаблон
                          </>
                        )}
                      </button>
                    </div>
                    
                    <textarea
                      readOnly
                      value={jsonTemplate}
                      onClick={(e) => e.target.select()}
                      className={`w-full h-44 p-3 rounded-xl font-mono text-[11px] leading-relaxed resize-none border focus:outline-none custom-scrollbar ${
                        isDark 
                          ? 'bg-transparent border-white/10 text-slate-300 cursor-text focus:border-blue-500/50' 
                          : 'bg-transparent border-slate-200 text-slate-700 cursor-text focus:border-blue-600'
                      }`}
                    />
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Buttons */}
        <div className={`p-6 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <button 
            onClick={() => onConfirm(recognizedItems)}
            disabled={recognizedItems.length === 0}
            className={`w-full flex items-center justify-center gap-3 h-[56px] rounded-xl font-black uppercase italic tracking-wider transition-all text-white ${
              recognizedItems.length === 0
                ? 'bg-slate-600/20 text-slate-500 cursor-not-allowed border border-dashed border-slate-500/20'
                : isBanImport
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            <Check size={18} />
            {isBanImport ? "Подтвердить импорт бан-листа" : "Подтвердить импорт данных"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImportJsonModal;