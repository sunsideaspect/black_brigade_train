import React, { useState, useEffect } from 'react';
import { TrainingFormData, ExperienceLevel, TRAINING_CATEGORIES } from '../types';
import { Loader2, Pickaxe, Shield, Check, ChevronDown, Square, SquareCheck } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: TrainingFormData) => void;
  isLoading: boolean;
}

const LOADING_MESSAGES = [
    "Аналізую рівень підготовки...",
    "Шукаю актуальні методички (Google)...",
    "Формую блок мінної безпеки...",
    "Підбираю контрольні питання...",
    "Перевіряю протоколи такмеду...",
    "Складаю графік занять..."
];

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [duration, setDuration] = useState<number>(3); // Зменшено до 3 для економії токенів
  const [level, setLevel] = useState<ExperienceLevel>(ExperienceLevel.NOVICE);
  const [notes, setNotes] = useState<string>('');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  
  // ОНОВЛЕНО: Дефолтні теми під реальний запит (Скиди, Взаємодія з пташкою)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "Фортифікація: Бліндажі та 'Лисячі нори'",
    "ВНП РФ та Мінна безпека (ПМН/ОЗМ)",
    "Захист від скидів (Мавік/Аутел)",
    "Робота під 'Пташкою' (Коригування по рації)"
  ]);

  // Ефект для зміни повідомлень завантаження
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
        setLoadingMsgIndex(0);
        interval = setInterval(() => {
            setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  // Логіка перемикання цілої категорії
  const toggleCategoryBlock = (categoryTopics: string[]) => {
    const selectedCount = categoryTopics.filter(t => selectedTopics.includes(t)).length;
    const isCategoryActive = selectedCount > 0;

    if (isCategoryActive) {
        // Якщо активна -> вимикаємо повністю
        setSelectedTopics(prev => prev.filter(t => !categoryTopics.includes(t)));
    } else {
        // Якщо вимкнена -> вмикаємо повністю
        const newTopics = [...selectedTopics];
        categoryTopics.forEach(t => {
            if (!newTopics.includes(t)) newTopics.push(t);
        });
        setSelectedTopics(newTopics);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTopics.length === 0) return;
    onSubmit({
      durationDays: duration,
      experienceLevel: level,
      focusAreas: selectedTopics,
      customNotes: notes
    });
  };

  return (
    <div className="w-full bg-stone-900 border border-stone-800 rounded-xl p-4 md:p-8 shadow-2xl shadow-black/50">
      <div className="flex items-center gap-3 mb-6 border-b border-stone-800 pb-4">
        <div className="bg-amber-500/10 p-2 rounded-lg shrink-0">
            <Pickaxe className="w-6 h-6 text-amber-500" />
        </div>
        <div>
            <h2 className="text-lg md:text-xl font-bold text-stone-100 leading-tight">Конфігуратор курсу</h2>
            <p className="text-stone-400 text-xs md:text-sm mt-0.5">Налаштуйте параметри підготовки</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        
        {/* Duration & Level Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300">Тривалість (днів)</label>
            <input 
              type="number" 
              min="1" 
              max="60"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 md:p-3 text-base text-stone-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-300">Рівень особового складу</label>
            <select 
              value={level}
              onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 md:p-3 text-base text-stone-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all appearance-none"
            >
              {Object.values(ExperienceLevel).map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Blocks */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-stone-300">Напрямки підготовки</label>
              <span className="text-xs text-stone-500 bg-stone-950 px-2 py-1 rounded-full border border-stone-800">{selectedTopics.length} обрано</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {TRAINING_CATEGORIES.map((category) => {
               const selectedCount = category.topics.filter(t => selectedTopics.includes(t)).length;
               const isCategoryActive = selectedCount > 0;

               return (
                <div 
                    key={category.id} 
                    className={`border rounded-lg overflow-hidden transition-all duration-300 ${
                        isCategoryActive 
                        ? 'bg-stone-900 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                        : 'bg-stone-950/30 border-stone-800'
                    }`}
                >
                    {/* Category Header (Main Toggle) */}
                    <button
                        type="button"
                        onClick={() => toggleCategoryBlock(category.topics)}
                        className="w-full px-4 py-4 flex items-center justify-between group outline-none active:bg-stone-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                            {/* Checkbox Icon */}
                            <div className={`shrink-0 transition-colors ${isCategoryActive ? 'text-amber-500' : 'text-stone-600'}`}>
                                {isCategoryActive ? <SquareCheck className="w-6 h-6 fill-amber-500/10" /> : <Square className="w-6 h-6" />}
                            </div>
                            
                            <div className="flex items-center gap-3 text-left overflow-hidden">
                                <span className="text-2xl shrink-0" role="img" aria-label={category.title}>{category.icon}</span>
                                <div className="truncate">
                                    <span className={`block font-bold text-base md:text-lg leading-tight truncate transition-colors ${isCategoryActive ? 'text-stone-100' : 'text-stone-400'}`}>
                                        {category.title}
                                    </span>
                                    {isCategoryActive && (
                                        <span className="text-xs text-stone-500 font-mono block mt-0.5">
                                            {selectedCount} / {category.topics.length} тем
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Chevron */}
                        <div className={`shrink-0 text-stone-600 transition-transform duration-300 ml-2 ${isCategoryActive ? 'rotate-180 text-amber-500' : ''}`}>
                            <ChevronDown className="w-5 h-5" />
                        </div>
                    </button>

                    {/* Topics Grid (Visible only if active) */}
                    {isCategoryActive && (
                        <div className="border-t border-stone-800/50 p-2 md:p-3 bg-black/20 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {category.topics.map((topic) => (
                                    <button
                                        key={topic}
                                        type="button"
                                        onClick={() => toggleTopic(topic)}
                                        className={`flex items-start gap-3 p-3 rounded-md text-left transition-all text-sm border active:scale-[0.98] ${
                                            selectedTopics.includes(topic)
                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-100'
                                            : 'bg-stone-950/40 border-transparent text-stone-500'
                                        }`}
                                    >
                                        <div className={`mt-0.5 w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-colors ${
                                            selectedTopics.includes(topic) 
                                                ? 'bg-amber-500 border-amber-500' 
                                                : 'border-stone-700 bg-stone-900'
                                        }`}>
                                            {selectedTopics.includes(topic) && <Check className="w-3.5 h-3.5 text-black" />}
                                        </div>
                                        <span className="leading-tight pt-0.5">{topic}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
               );
            })}
          </div>
        </div>

        {/* Custom Notes */}
        <div className="space-y-2">
           <label className="block text-sm font-medium text-stone-300">Коментар для інструктора</label>
           <textarea
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
             placeholder="Наприклад: група складається з колишніх піхотинців, акцент на мінах-пастках..."
             className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-base text-stone-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all h-24 resize-none placeholder:text-stone-600"
           />
        </div>

        {/* Submit Action */}
        <div className="sticky bottom-4 md:static z-10">
            <button
                type="submit"
                disabled={isLoading || selectedTopics.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl ${
                    isLoading || selectedTopics.length === 0
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-amber-900/40 active:scale-[0.98]'
                }`}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center">
                         <div className="flex items-center gap-2 mb-1">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Працюю...</span>
                         </div>
                         <span className="text-xs font-normal opacity-80 animate-pulse">{LOADING_MESSAGES[loadingMsgIndex]}</span>
                    </div>
                ) : (
                    <>
                        <Shield className="w-6 h-6" />
                        Сформувати план
                    </>
                )}
            </button>
        </div>

      </form>
    </div>
  );
};