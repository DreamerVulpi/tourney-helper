import React, { useState, useEffect } from 'react';
import { X, Plus, UserPlus, Save, Hash, RefreshCcw, Edit3 } from 'lucide-react'; // Добавил Edit3

const ParticipantModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData = null, 
    loading = false,
    theme = 'dark' 
}) => {
    // Режим определяется наличием переданных данных
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState({
        nickname: '',
        gameId: '',
        region: 'Europe',
        locale: 'RU',
        rating: 0,
        messenger: { active: false, platform: 'Discord', login: '' },
        tournament: { active: false, platform: 'Startgg', login: '' }
    });

    // Внутри ParticipantModal.jsx

const handleSave = () => {
    // 1. Убираем лишние пробелы из начала и конца строк
    const trimmedNickname = formData.nickname.trim();
    const trimmedGameId = formData.gameId.trim();

    // 2. Проверяем обязательные базовые поля
    if (!trimmedNickname) {
        alert("Ошибка: Никнейм игрока не может быть пустым!"); 
        // Здесь вместо alert в будущем можно использовать красивый addLog, 
        // если прокинуть его через пропсы, или локальный стейт для вывода ошибки под инпутом
        return;
    }

    if (!trimmedGameId) {
        alert("Ошибка: Игровой ID не может быть пустым!");
        return;
    }

    // 3. Дополнительная проверка для раскрытых дополнительных секций:
    // Если пользователь активировал мессенджер, но оставил поле логина пустым
    if (formData.messenger.active && !formData.messenger.login.trim()) {
        alert("Ошибка: Вы активировали поле мессенджера, но не указали логин!");
        return;
    }

    // Если пользователь активировал турнирную платформу, но оставил поле логина пустым
    if (formData.tournament.active && !formData.tournament.login.trim()) {
        alert("Ошибка: Вы активировали поле турнирной платформы, но не указали логин!");
        return;
    }

    // Если все проверки пройдены — отправляем очищенные от пробелов данные наверх в DatabasePlate
    onSave({
        ...formData,
        nickname: trimmedNickname,
        gameId: trimmedGameId,
        messenger: {
            ...formData.messenger,
            login: formData.messenger.login.trim()
        },
        tournament: {
            ...formData.tournament,
            login: formData.tournament.login.trim()
        }
    });
};

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // В режиме Edit заполняем из данных игрока
                setFormData({
                    nickname: initialData.gameNickname || '',
                    gameId: initialData.gameId || '',
                    region: initialData.region || 'Europe',
                    locale: initialData.locale || 'RU',
                    rating: initialData.rating || 0,
                    messenger: { 
                        active: !!initialData.messenagerLogin, 
                        platform: initialData.messenagerName || 'Discord', 
                        login: initialData.messenagerLogin || '' 
                    },
                    tournament: { 
                        active: !!initialData.tournamentPlatformLogin, 
                        platform: initialData.tournamentPlatformName || 'Startgg', 
                        login: initialData.tournamentPlatformLogin || '' 
                    }
                });
            } else {
                // В режиме Add сбрасываем в дефолт
                setFormData({
                    nickname: '', gameId: '', region: 'Europe', locale: 'RU', rating: 0,
                    messenger: { active: false, platform: 'Discord', login: '' },
                    tournament: { active: false, platform: 'Startgg', login: '' }
                });
            }
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const isDark = theme === 'dark';

    const inputClasses = `w-full bg-transparent border rounded-xl p-3 outline-none transition-all text-sm font-medium ${
        isDark 
        ? 'border-white/10 focus:border-blue-500/50 text-white placeholder:text-slate-600' 
        : 'border-slate-200 focus:border-blue-600 text-slate-900 placeholder:text-slate-400'
    }`;

    const labelClasses = `block text-[10px] font-black uppercase tracking-widest mb-2 ${
        isDark ? 'text-slate-500' : 'text-slate-400'
    }`;

    const sectionBtnClasses = `flex items-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all mb-4 ${
        isDark 
        ? 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10' 
        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200'
    }`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${
                isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-slate-200'
            }`}>
                
                {/* Header: Меняем иконку и заголовок */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isEditMode ? 'bg-amber-500/20' : 'bg-blue-600/20'}`}>
                            {isEditMode ? (
                                <Edit3 size={18} className="text-amber-500" />
                            ) : (
                                <UserPlus size={18} className="text-blue-500" />
                            )}
                        </div>
                        <h2 className={`text-sm font-black uppercase italic tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {isEditMode ? 'Изменить данные участника' : 'Добавить участника'}
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
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Nickname */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClasses}>Никнейм</label>
                            <input 
                                type="text"
                                placeholder="Headache"
                                value={formData.nickname}
                                onChange={e => setFormData({...formData, nickname: e.target.value})}
                                className={inputClasses}
                            />
                        </div>

                        {/* Game ID */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClasses}>Игровой ID</label>
                            <input 
                                type="text"
                                placeholder="12345678"
                                value={formData.gameId}
                                onChange={e => setFormData({...formData, gameId: e.target.value})}
                                className={inputClasses}
                            />
                        </div>

                        {/* Region */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClasses}>Регион</label>
                            <select 
                                value={formData.region}
                                onChange={e => setFormData({...formData, region: e.target.value})}
                                className={inputClasses}
                            >
                                <option value="Europe">Europe</option>
                                <option value="Asia">Asia</option>
                                <option value="Africa">Africa</option>
                            </select>
                        </div>

                        {/* Locale */}
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClasses}>Язык</label>
                            <select 
                                value={formData.locale}
                                onChange={e => setFormData({...formData, locale: e.target.value})}
                                className={inputClasses}
                            >
                                <option value="RU">RU</option>
                                <option value="EN">EN</option>
                            </select>
                        </div>

                        {/* MMR Rating */}
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

                    {/* Additional Sections */}
                    <div className="space-y-4">
    {formData.messenger.active ? (
        <div className={`p-4 rounded-xl border relative ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center mb-2">
                <label className={labelClasses}>Контакт мессенджера</label>
                {/* Кнопка закрытия секции */}
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
                    <option value="Discord">Discord</option>
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
        <button 
            onClick={() => setFormData({...formData, messenger: {...formData.messenger, active: true}})}
            className={sectionBtnClasses}
        >
            <Plus size={14} /> Добавить контакт мессенджера
        </button>
    )}

    {/* Tournament Section */}
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
                    <option value="Startgg">Startgg</option>
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
        <button 
            onClick={() => setFormData({...formData, tournament: {...formData.tournament, active: true}})}
            className={sectionBtnClasses}
        >
            <Plus size={14} /> Добавить данные платформы
        </button>
    )}
</div>
                </div>

                {/* Footer Buttons */}
                <div className={`p-6 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <button 
                        onClick={() => onSave(formData)}
                        className={`w-full flex items-center justify-center gap-3 h-[56px] rounded-xl font-black uppercase italic tracking-wider transition-all ${
                            isEditMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                        } text-white`}
                    >
                        <Save size={18} />
                        {isEditMode ? 'Сохранить изменения' : 'Создать запись'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParticipantModal;
