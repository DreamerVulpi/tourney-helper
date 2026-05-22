import React, { useState, useEffect } from 'react';
import { X, Ban, ShieldCheck, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';

const ParticipantActionModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    actionType, // 'ban', 'unban', 'delete', 'reset_rating_all'
    participantData, // { nickname: 'DoshiPanda', ... } или null при глобальных экшенах
    currentGame,
    loading = false,
    theme = 'dark' 
}) => {
    // Важно: для reset_rating_all participantData будет null, поэтому убираем жесткую блокировку
    if (!isOpen || (!participantData && actionType !== 'reset_rating_all')) return null;

    const isDark = theme === 'dark';

    // Список предустановленных причин: value пойдет в бэкенд (Go), label — отображается юзеру
    const banReasons = [
        { value: 'software/cheats', label: 'Использование стороннего ПО / Читы' },
        { value: 'toxic/insults', label: 'Оскорбления участников / Токсичное поведение' },
        { value: 'rules/violation', label: 'Нарушение регламента турнира' },
        { value: 'match/sabotage', label: 'Саботаж матчей / Намеренный проигрыш' },
        { value: 'smurfing', label: 'Смурфинг / Игра с чужого аккаунта' },
        { value: 'other', label: 'Другое' }
    ];

    // Стейты для полей бана
    const [typeBan, setTypeBan] = useState(banReasons[0].value);
    const [reason, setReason] = useState(''); // Это описание/подробности нарушения
    const [duration, setDuration] = useState('1');
    const [unit, setUnit] = useState('days'); // 'minutes' | 'hours' | 'days' | 'months'
    const [isPermanent, setIsPermanent] = useState(false);

    // Сбрасываем поля при открытии окна или смене типа действия
    useEffect(() => {
        if (isOpen) {
            setTypeBan(banReasons[0].value);
            setReason('');
            setDuration('1');
            setUnit('days');
            setIsPermanent(false);
        }
    }, [isOpen, actionType]);

    // Конфигурация интерфейса в зависимости от типа действия
    const config = {
        ban: {
            title: 'Забанить участника',
            icon: <Ban className="text-red-500" size={18} />,
            iconContainerBg: 'bg-red-500/20',
            btnBg: 'bg-red-600 hover:bg-red-500',
            btnText: 'Забанить',
            confirmIcon: <Ban size={18} />
        },
        unban: {
            title: 'Разбанить участника',
            icon: <ShieldCheck className="text-green-500" size={18} />,
            iconContainerBg: 'bg-green-500/20',
            btnBg: 'bg-green-600 hover:bg-green-500',
            btnText: 'Разбанить',
            confirmIcon: <ShieldCheck size={18} />
        },
        delete: {
            title: 'Удалить участника',
            icon: <Trash2 className="text-rose-500" size={18} />,
            iconContainerBg: 'bg-rose-500/20',
            btnBg: 'bg-rose-600 hover:bg-rose-500',
            btnText: 'Удалить навсегда',
            confirmIcon: <Trash2 size={18} />
        },
        // --- Добавили новую конфигурацию для сброса рейтинга ---
        reset_rating_all: {
            title: 'Обнуление рейтинга',
            icon: <RotateCcw className="text-red-500" size={18} />,
            iconContainerBg: 'bg-red-500/20',
            btnBg: 'bg-red-600 hover:bg-red-500',
            btnText: 'Сбросить все рейтинги',
            confirmIcon: <RotateCcw size={18} />
        }
    }[actionType] || {
        title: '',
        icon: null,
        iconContainerBg: '',
        btnBg: '',
        btnText: '',
        confirmIcon: null
    };

    const handleConfirm = () => {
        if (actionType === 'ban') {
            if (!isPermanent && (!duration || parseInt(duration) <= 0)) {
                alert("Ошибка: Укажите корректный срок бана или выберите вариант 'Навсегда'!");
                return;
            }
            
            onConfirm({
                action: 'ban',
                id: participantData.id,
                typeBan: typeBan,
                reason: reason.trim(),
                isPermanent: isPermanent,
                duration: isPermanent ? 0 : parseInt(duration),
                unit: isPermanent ? 'infinite' : unit
            });
        } else {
            // Для остальных экшенов (включая reset_rating_all) просто прокидываем тип
            onConfirm({ action: actionType });
        }
    };

    // Стили для инпутов, селектов и текстареа
    const inputClasses = `w-full bg-transparent border rounded-xl p-3 outline-none transition-all text-sm font-medium ${
        isDark 
            ? 'border-white/10 focus:border-red-500/50 text-white placeholder:text-slate-600 focus:bg-white/[0.02]' 
            : 'border-slate-200 focus:border-red-600 text-slate-900 placeholder:text-slate-400 focus:bg-slate-50/50'
    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;

    const selectOptionClasses = isDark ? 'bg-[#121212] text-white' : 'bg-white text-slate-900';

    const labelClasses = `block text-[10px] font-black uppercase tracking-widest mb-2 ${
        isDark ? 'text-slate-500' : 'text-slate-400'
    }`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Бекдроп (Затемнение фона) */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!loading ? onClose : undefined}
            />

            {/* Контейнер модального окна */}
            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border transition-all transform ${
                isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-slate-200'
            }`}>
                
                {/* Хедер */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${
                    isDark ? 'border-white/5' : 'border-slate-100'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.iconContainerBg}`}>
                            {config.icon}
                        </div>
                        <h2 className={`text-sm font-black uppercase italic tracking-tight ${
                            isDark ? 'text-white' : 'text-slate-800'
                        }`}>
                            {config.title}
                            {participantData?.nickname && (
                                <>: <span className="text-blue-500 not-italic normal-case ml-1">{participantData.nickname}</span></>
                            )}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className={`p-2 rounded-lg transition-all ${
                            loading ? 'opacity-20 cursor-not-allowed' : 'hover:bg-red-500/10 text-slate-500 hover:text-red-500'
                        }`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Контентная часть */}
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-5">
                    {actionType === 'reset_rating_all' ? (
                        /* Окно глобального сброса рейтинга */
                        <div className={`flex flex-col items-center text-center p-5 rounded-xl border ${
                            isDark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-500/[0.02] border-red-100'
                        }`}>
                            <AlertTriangle className="text-red-500 mb-3 animate-pulse" size={36} />
                            <p className={`text-sm font-semibold leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
    Вы уверены, что хотите сбросить MMR рейтинг <span className="text-red-500 font-black italic">абсолютно всех игроков</span> игры <span className="text-red-500 font-black italic">{currentGame}</span> в базе данных до 0?
</p>
                            <p className="text-[10px] font-black uppercase italic tracking-wider text-red-500 bg-red-500/10 px-3 py-1 rounded-md mt-4">
                                Действие сотрет текущую статистику лидерборда!
                            </p>
                        </div>
                    ) : actionType === 'delete' ? (
                        /* Окно удаления */
                        <div className={`flex flex-col items-center text-center p-5 rounded-xl border ${
                            isDark ? 'bg-rose-500/5 border-rose-500/10' : 'bg-rose-500/[0.02] border-rose-100'
                        }`}>
                            <AlertTriangle className="text-rose-500 mb-3 animate-pulse" size={36} />
                            <p className={`text-sm font-semibold leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                Вы уверены, что хотите удалить <span className="text-rose-500 font-black italic">{participantData?.nickname}</span> со всеми его данными?
                            </p>
                            <p className="text-[10px] font-black uppercase italic tracking-wider text-rose-500 bg-rose-500/10 px-3 py-1 rounded-md mt-4">
                                Процесс необратим!
                            </p>
                        </div>
                    ) : actionType === 'ban' ? (
                        /* Поля для Бана */
                        <div className="space-y-4">
                            <div>
                                <label className={labelClasses}>Причина бана *</label>
                                <select 
                                    className={`${inputClasses} cursor-pointer`}
                                    value={typeBan}
                                    onChange={e => setTypeBan(e.target.value)}
                                    disabled={loading}
                                >
                                    {banReasons.map((item, idx) => (
                                        <option key={idx} value={item.value} className={selectOptionClasses}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Срок бана */}
                            <div>
                                <label className={labelClasses}>Срок бана</label>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="number"
                                        min="1"
                                        placeholder="1"
                                        className={`${inputClasses} flex-1`}
                                        value={isPermanent ? '' : duration}
                                        onChange={e => setDuration(e.target.value)}
                                        disabled={loading || isPermanent}
                                    />
                                    <select
                                        className={`${inputClasses} flex-1 cursor-pointer`}
                                        value={unit}
                                        onChange={e => setUnit(e.target.value)}
                                        disabled={loading || isPermanent}
                                    >
                                        <option value="minutes" className={selectOptionClasses}>минут</option>
                                        <option value="hours" className={selectOptionClasses}>часов</option>
                                        <option value="days" className={selectOptionClasses}>дней</option>
                                        <option value="months" className={selectOptionClasses}>месяцев</option>
                                    </select>
                                </div>
                            </div>

                            {/* Чекбокс "Навсегда" */}
                            <div className="flex items-center pt-1">
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input 
                                        type="checkbox"
                                        checked={isPermanent}
                                        onChange={e => setIsPermanent(e.target.checked)}
                                        disabled={loading}
                                        className={`w-4 h-4 rounded border transition-all cursor-pointer accent-red-600 ${
                                            isDark ? 'bg-transparent border-white/20' : 'bg-white border-slate-300'
                                        }`}
                                    />
                                    <span className={`text-xs font-bold transition-colors ${
                                        isPermanent 
                                            ? 'text-red-500' 
                                            : isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-800'
                                    }`}>
                                        Навсегда (Перманентная блокировка)
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className={labelClasses}>Описание нарушения</label>
                                <textarea 
                                    placeholder="Дополнительные подробности, ссылки на реплеи или таймкоды..."
                                    className={`${inputClasses} h-24 py-3 resize-none custom-scrollbar`}
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    ) : (
                        /* Окно Разбана */
                        <div className={`flex flex-col items-center text-center p-5 rounded-xl border ${
                            isDark ? 'bg-green-500/5 border-green-500/10' : 'bg-green-500/[0.02] border-green-100'
                        }`}>
                            <ShieldCheck className="text-green-500 mb-2" size={40} />
                            <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                Восстановить доступ участнику <span className="text-green-500 font-black italic">{participantData?.nickname}</span> к турнирам?
                            </p>
                        </div>
                    )}
                </div>

                {/* Кнопка подтверждения */}
                <div className={`p-6 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <button 
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-3 h-[56px] rounded-xl font-black uppercase italic tracking-wider transition-all text-white shadow-lg ${config.btnBg} ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {config.confirmIcon}
                        {loading ? 'Обработка...' : config.btnText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParticipantActionModal;