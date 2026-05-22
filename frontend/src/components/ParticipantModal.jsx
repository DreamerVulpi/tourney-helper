import React, { useState, useEffect } from 'react';
import { X, Plus, UserPlus, Save, Hash, RefreshCcw, Edit3 } from 'lucide-react';

const ParticipantModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData = null, 
    loading = false,
    theme = 'dark',
    activeFilter = 'all' // Проп для отслеживания текущей вкладки бан-листа
}) => {
    // Режим определяется наличием переданных данных
    const isEditMode = !!initialData;
    // Режим создания игрока сразу в бан-лист
    const isBanMode = activeFilter === 'banned' && !isEditMode;

    const [formData, setFormData] = useState({
        nickname: '',
        gameId: '',
        region: 'Europe',
        locale: 'RU',
        rating: 0,
        messenger: { active: false, platform: 'Discord', login: '' },
        tournament: { active: false, platform: 'Startgg', login: '' }
    });

    // Стейты для полей бана
    const [banData, setBanData] = useState({
        typeBan: 'software/cheats',
        reason: '',
        duration: 30,
        unit: 'days',
        isPermanent: false
    });

    const banReasons = [
        { value: 'software/cheats', label: 'Использование стороннего ПО / Читы' },
        { value: 'toxic/insults', label: 'Оскорбления участников / Токсичное поведение' },
        { value: 'rules/violation', label: 'Нарушение регламента турнира' },
        { value: 'match/sabotage', label: 'Саботаж матчей / Намеренный проигрыш' },
        { value: 'smurfing', label: 'Смурфинг / Игра с чужого аккаунта' }
    ];

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    nickname: initialData.gameNickname || initialData.nickname || '',
                    gameId: initialData.gameId || '',
                    region: initialData.region || 'Europe',
                    locale: initialData.locale || 'RU',
                    rating: initialData.rating || 0,
                    messenger: { 
                        active: !!(initialData.messenagerLogin || initialData.messengerLogin), 
                        platform: initialData.messenagerName || 'Discord', 
                        login: initialData.messenagerLogin || initialData.messengerLogin || '' 
                    },
                    tournament: { 
                        active: !!initialData.tournamentPlatformLogin, 
                        platform: initialData.tournamentPlatformName || 'Startgg', 
                        login: initialData.tournamentPlatformLogin || '' 
                    }
                });
            } else {
                setFormData({
                    nickname: '', gameId: '', region: 'Europe', locale: 'RU', rating: 0,
                    messenger: { active: false, platform: 'Discord', login: '' },
                    tournament: { active: false, platform: 'Startgg', login: '' }
                });
                setBanData({
                    typeBan: 'software/cheats',
                    reason: '',
                    duration: 30,
                    unit: 'days',
                    isPermanent: false
                });
            }
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const isDark = theme === 'dark';

    const handleSave = () => {
        const trimmedNickname = formData.nickname.trim();
        const trimmedGameId = formData.gameId.trim();

        if (!trimmedNickname) {
            alert("Ошибка: Никнейм игрока не может быть пустым!"); 
            return;
        }

        if (!trimmedGameId) {
            alert("Ошибка: Игровой ID не может быть пустым!");
            return;
        }

        if (formData.messenger.active && !formData.messenger.login.trim()) {
            alert("Ошибка: Вы активировали поле мессенджера, но не указали логин!");
            return;
        }

        if (formData.tournament.active && !formData.tournament.login.trim()) {
            alert("Ошибка: Вы активировали поле турнирной платформы, но не указали логин!");
            return;
        }

        // Если это прямая блокировка, прикрепляем данные о бане нарушителя
        if (isBanMode) {
            onSave({
                ...formData,
                nickname: trimmedNickname,
                gameId: trimmedGameId,
                messenger: { ...formData.messenger, login: formData.messenger.login.trim() },
                tournament: { ...formData.tournament, login: formData.tournament.login.trim() },
                isDirectBan: true,
                banInfo: {
                    ...banData,
                    reason: banData.reason.trim() || "Причина не указана администратором"
                }
            });
        } else {
            onSave({
                ...formData,
                nickname: trimmedNickname,
                gameId: trimmedGameId,
                messenger: { ...formData.messenger, login: formData.messenger.login.trim() },
                tournament: { ...formData.tournament, login: formData.tournament.login.trim() }
            });
        }
    };

    // Динамический подбор классов фокуса (Красный для бана, Синий для обычного, Янтарный для редактирования)
    const focusRingClass = isBanMode
        ? 'focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10'
        : isEditMode
        ? 'focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10'
        : isDark
        ? 'focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10'
        : 'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10';

    const inputClasses = `w-full bg-transparent border rounded-xl p-3 outline-none transition-all text-sm font-medium ${focusRingClass} ${
        isDark 
        ? 'border-white/10 text-white placeholder:text-slate-600' 
        : 'border-slate-200 text-slate-900 placeholder:text-slate-400'
    }`;

    const labelClasses = `block text-[10px] font-black uppercase tracking-widest mb-2 ${
        isDark ? 'text-slate-500' : 'text-slate-400'
    }`;

    const sectionBtnClasses = `flex items-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all mb-4 ${
        isDark 
        ? 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10' 
        : `bg-slate-50 border-slate-200 text-slate-500 ${isBanMode ? 'hover:text-red-600 hover:border-red-200' : 'hover:text-blue-600 hover:border-blue-200'}`
    }`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border transition-colors duration-300 ${
                isDark 
                    ? isBanMode ? 'bg-[#0f0a0a] border-red-500/20' : 'bg-[#121212] border-white/10' 
                    : isBanMode ? 'bg-red-50/[0.02] border-red-200' : 'bg-white border-slate-200'
            }`}>
                
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${
                            isBanMode ? 'bg-red-500/20' : isEditMode ? 'bg-amber-500/20' : 'bg-blue-600/20'
                        }`}>
                            {isBanMode ? (
                                <UserPlus size={18} className="text-red-500" />
                            ) : isEditMode ? (
                                <Edit3 size={18} className="text-amber-500" />
                            ) : (
                                <UserPlus size={18} className="text-blue-500" />
                            )}
                        </div>
                        <h2 className={`text-sm font-black uppercase italic tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {isBanMode ? 'Внести нарушителя в бан-лист' : isEditMode ? 'Изменить данные участника' : 'Добавить участника'}
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

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
                    
                    {/* Основные инпуты */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClasses}>Никнейм *</label>
                            <input 
                                type="text"
                                placeholder="Headache"
                                value={formData.nickname}
                                onChange={e => setFormData({...formData, nickname: e.target.value})}
                                className={inputClasses}
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClasses}>Игровой ID *</label>
                            <input 
                                type="text"
                                placeholder="12345678"
                                value={formData.gameId}
                                onChange={e => setFormData({...formData, gameId: e.target.value})}
                                className={inputClasses}
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClasses}>Регион</label>
                            <select 
                                value={formData.region}
                                onChange={e => setFormData({...formData, region: e.target.value})}
                                className={inputClasses}
                            >
                                <option value="Europe" className={isDark ? 'bg-[#121212]' : 'bg-white'}>Europe</option>
                                <option value="Asia" className={isDark ? 'bg-[#121212]' : 'bg-white'}>Asia</option>
                                <option value="Africa" className={isDark ? 'bg-[#121212]' : 'bg-white'}>Africa</option>
                            </select>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClasses}>Язык</label>
                            <select 
                                value={formData.locale}
                                onChange={e => setFormData({...formData, locale: e.target.value})}
                                className={inputClasses}
                            >
                                <option value="RU" className={isDark ? 'bg-[#121212]' : 'bg-white'}>RU</option>
                                <option value="EN" className={isDark ? 'bg-[#121212]' : 'bg-white'}>EN</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className={labelClasses}>MMR Рейтинг</label>
                            <div className="relative">
                                <input 
                                    type="number"
                                    min="0"
                                    value={formData.rating}
                                    onChange={e => setFormData({...formData, rating: parseInt(e.target.value) || 0})}
                                    className={inputClasses}
                                />
                                <Hash size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
                            </div>
                        </div>
                    </div>

                    {/* Дополнительные платформы */}
                    <div className="space-y-4">
                        {formData.messenger.active ? (
                            <div className={`p-4 rounded-xl border relative ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className={labelClasses}>Контакт мессенджера</label>
                                    <button 
                                        onClick={() => setFormData({...formData, messenger: {...formData.messenger, active: false, login: ''}})}
                                        className="text-slate-500 hover:text-red-500 transition-colors"
                                        title="Убрать поле"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <select 
                                        className={inputClasses}
                                        value={formData.messenger.platform}
                                        onChange={e => setFormData({...formData, messenger: {...formData.messenger, platform: e.target.value}})}
                                    >
                                        <option value="Discord" className={isDark ? 'bg-[#121212]' : 'bg-white'}>Discord</option>
                                    </select>
                                    <input 
                                        type="text"
                                        placeholder="Login"
                                        className={inputClasses}
                                        value={formData.messenger.login}
                                        onChange={e => setFormData({...formData, messenger: {...formData.messenger, login: e.target.value}})}
                                    />
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setFormData({...formData, messenger: {...formData.messenger, active: true}})} className={sectionBtnClasses}>
                                <Plus size={14} /> Добавить контакт мессенджера
                            </button>
                        )}

                        {formData.tournament.active ? (
                            <div className={`p-4 rounded-xl border relative ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className={labelClasses}>Турнирная платформа</label>
                                    <button 
                                        onClick={() => setFormData({...formData, tournament: {...formData.tournament, active: false, login: ''}})}
                                        className="text-slate-500 hover:text-red-500 transition-colors"
                                        title="Убрать поле"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <select 
                                        className={inputClasses}
                                        value={formData.tournament.platform}
                                        onChange={e => setFormData({...formData, tournament: {...formData.tournament, platform: e.target.value}})}
                                    >
                                        <option value="Startgg" className={isDark ? 'bg-[#121212]' : 'bg-white'}>Startgg</option>
                                    </select>
                                    <input 
                                        type="text"
                                        placeholder="Nickname"
                                        className={inputClasses}
                                        value={formData.tournament.login}
                                        onChange={e => setFormData({...formData, tournament: {...formData.tournament, login: e.target.value}})}
                                    />
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setFormData({...formData, tournament: {...formData.tournament, active: true}})} className={sectionBtnClasses}>
                                <Plus size={14} /> Добавить данные платформы
                            </button>
                        )}
                    </div>

                    {/* СТРОГИЙ КРАСНЫЙ БЛОК ПАРАМЕТРОВ БАНА */}
                    {isBanMode && (
                        <div className={`space-y-4 pt-5 border-t ${isDark ? 'border-red-500/10' : 'border-red-200'}`}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className={labelClasses}>Категория нарушения</label>
                                    <select 
                                        className={inputClasses} 
                                        value={banData.typeBan}
                                        onChange={e => setBanData({...banData, typeBan: e.target.value})}
                                    >
                                        {banReasons.map(r => (
                                            <option key={r.value} value={r.value} className={isDark ? 'bg-[#121212]' : 'bg-white'}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2 sm:col-span-1 flex items-center h-[46px] sm:mt-6">
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={banData.isPermanent}
                                            onChange={e => setBanData({...banData, isPermanent: e.target.checked})}
                                        />
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all peer-checked:bg-red-600 peer-checked:border-red-600 ${
                                            isDark ? 'bg-black/40 border-white/10' : 'bg-white border-slate-300'
                                        }`}>
                                            <X size={12} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Перманентный бан
                                        </span>
                                    </label>
                                </div>

                                {!banData.isPermanent && (
                                    <>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className={labelClasses}>Срок действия</label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                className={inputClasses}
                                                value={banData.duration}
                                                onChange={e => setBanData({...banData, duration: parseInt(e.target.value) || 1})}
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className={labelClasses}>Единица времени</label>
                                            <select 
                                                className={inputClasses}
                                                value={banData.unit}
                                                onChange={e => setBanData({...banData, unit: e.target.value})}
                                            >
                                                <option value="days" className={isDark ? 'bg-[#121212]' : 'bg-white'}>Дней</option>
                                                <option value="months" className={isDark ? 'bg-[#121212]' : 'bg-white'}>Месяцев</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="col-span-2">
                                    <label className={labelClasses}>Описание нарушения / Доказательства</label>
                                    <textarea 
                                        placeholder="Укажите причину блокировки или ссылку на медиафайлы инцидента..."
                                        value={banData.reason}
                                        onChange={e => setBanData({...banData, reason: e.target.value})}
                                        className={`w-full h-24 p-3 rounded-xl text-sm font-medium border resize-none focus:outline-none custom-scrollbar ${focusRingClass} ${
                                            isDark 
                                                ? 'bg-transparent border-white/10 text-white' 
                                                : 'bg-transparent border-slate-200 text-slate-900'
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className={`p-6 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-3 h-[56px] rounded-xl font-black uppercase italic tracking-wider transition-all text-white ${
                            isBanMode 
                                ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/10' 
                                : isEditMode 
                                ? 'bg-amber-600 hover:bg-amber-500' 
                                : 'bg-blue-600 hover:bg-blue-500'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Save size={18} />
                        {loading ? 'Обработка...' : isBanMode ? 'Забанить и сохранить' : isEditMode ? 'Сохранить изменения' : 'Создать запись'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParticipantModal;