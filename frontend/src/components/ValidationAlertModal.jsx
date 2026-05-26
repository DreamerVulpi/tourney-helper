import React from "react";
import { X, Check, AlertTriangle } from "lucide-react";

const ValidationAlertModal = ({ isOpen, message, onClose, theme = 'dark' }) => {
  // Если окно закрыто — ничего не рендерим
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Задний фон-блюр с закрытием по клику вне окна */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${
        isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header (Шапка) */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-white/5' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            {/* Иконка предупреждения в фирменном красном полупрозрачном боксе */}
            <div className="p-2 rounded-lg bg-red-600/20">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <h2 className={`text-sm font-black uppercase italic tracking-tight ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}>
              Ошибка заполнения параметров
            </h2>
          </div>
          {/* Кнопка закрытия "Крестик" */}
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg transition-all hover:bg-red-500/10 text-slate-500 hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Контентная часть) */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
          <p className={`text-xs leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Для продолжения работы и запуска предварительной проверки авторизации необходимо исправить конфигурацию приложения:
          </p>

          {/* Информационная плашка с текстом ошибки в стиле исходного модального окна */}
          <div className={`flex flex-col items-center text-center p-5 rounded-xl border ${
            isDark 
              ? 'bg-red-500/5 border-red-500/20 text-red-400' 
              : 'bg-red-500/[0.02] border-red-200 text-red-700'
          }`}>
            <p className="text-[11px] font-semibold leading-relaxed max-w-sm">
              {message}
            </p>
          </div>
        </div>

        {/* Footer (Футер с кнопкой подтверждения) */}
        <div className={`p-6 border-t ${
          isDark ? 'border-white/5' : 'border-slate-100'
        }`}>
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-3 h-[56px] rounded-xl font-black uppercase italic tracking-wider transition-all text-white bg-red-600 hover:bg-red-500 active:scale-[0.98]"
          >
            <Check size={18} />
            Понятно, исправить поля
          </button>
        </div>

      </div>
    </div>
  );
};

export default ValidationAlertModal;