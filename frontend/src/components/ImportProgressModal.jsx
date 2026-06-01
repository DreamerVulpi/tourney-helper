import React from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

const ImportProgressModal = ({ isOpen, onClose, theme = "dark", status, errorData, resultData }) => {
  if (!isOpen) return null;

  const isDark = theme === "dark";

  // Определяем состояние на основе пропсов из главного компонента
  const isError = !!errorData;
  const isCompleted = status === "success";

  // Текст статуса в зависимости от этапа
  let statusText = "Инициализация импорта и парсинг...";
  if (status === "loading") statusText = "Запись участников в базу данных SQLite...";
  if (isCompleted) {
    const successCount = resultData?.r1 ?? resultData?.s ?? 0;
    const totalCount = resultData?.r2 ?? resultData?.t ?? 0;
    statusText = `Импорт успешно завершен! Обработано записей: ${successCount} из ${totalCount}`;
  }
  if (isError) {
    statusText = `Ошибка импорта: ${errorData}`;
  }

  // Прогресс-бар (пока нет эмиттера, сделаем 0%, 50% во время работы и 100% в конце)
  let progress = 0;
  if (status === "loading") progress = 50;
  if (isCompleted) progress = 100;
  if (isError) progress = 100;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Задний фон-затемнение */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all ${
        isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        
        <div className="flex flex-col items-center text-center space-y-4">
          
          {/* Иконка статуса */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10">
            {isError ? (
              <AlertCircle size={32} className="text-red-500 animate-pulse" />
            ) : isCompleted ? (
              <CheckCircle2 size={32} className="text-green-500" />
            ) : (
              <RefreshCw size={28} className="text-blue-500 animate-spin duration-1000" />
            )}
          </div>

          {/* Текстовый Статус */}
          <div className="space-y-1 w-full">
            <h3 className="text-[10px] font-black uppercase tracking-wider italic text-slate-500">
              {isError ? "Критический сбой" : "Выполнение операции"}
            </h3>
            <p className={`text-xs font-bold min-h-[20px] px-2 break-words ${isError ? "text-red-400" : ""}`}>
              {statusText}
            </p>
          </div>

          {/* Прогресс бар */}
          <div className="w-full space-y-1.5 pt-2">
            <div className="flex justify-between text-[10px] font-mono font-bold opacity-60">
              <span>{progress}%</span>
              {isCompleted && resultData && (
                <span>{(resultData?.r1 ?? resultData?.s ?? 0)} строк</span>
              )}
            </div>
            
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isError ? "bg-red-500" : isCompleted ? "bg-green-500" : "bg-blue-600"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Кнопка закрытия / Окей (появляется при успешном завершении ИЛИ при ошибке) */}
          {(isCompleted || isError) && (
            <button
              onClick={onClose}
              className={`w-full h-[44px] mt-2 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all ${
                isError 
                  ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20" 
                  : "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-600/20"
              }`}
            >
              {isError ? "Закрыть" : "Готово"}
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default ImportProgressModal;