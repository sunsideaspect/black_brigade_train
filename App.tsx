import React, { useState, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { PlanDisplay } from './components/PlanDisplay';
import { generateTrainingPlan, validateApiKey } from './services/geminiService.ts';
import { TrainingFormData, TrainingPlanResponse } from './types';
import { TriangleAlert, History, Settings, X, KeyRound, ExternalLink, Save, CheckCircle2, XCircle, Loader2, RefreshCcw } from 'lucide-react';

const STORAGE_KEY = 'sapper_hub_last_plan';
const API_KEY_STORAGE = 'user_gemini_api_key';

const App: React.FC = () => {
  const [plan, setPlan] = useState<TrainingPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  
  // Key Validation State
  const [checkingKey, setCheckingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [keyErrorMsg, setKeyErrorMsg] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            setPlan(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to load saved plan", e);
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    
    // Load saved API key
    const savedKey = localStorage.getItem(API_KEY_STORAGE);
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  const handleFormSubmit = async (data: TrainingFormData) => {
    // 1. Перевіряємо чи є ключ взагалі (в сховищі або в env)
    const storedKey = localStorage.getItem(API_KEY_STORAGE);
    const envKey = process.env.API_KEY;
    const hasValidKey = (storedKey && storedKey.trim().length > 0) || (envKey && envKey.trim().length > 0);

    // 2. Якщо ключа немає - змушуємо ввести
    if (!hasValidKey) {
        setShowSettings(true);
        setError("Для початку роботи необхідно ввести API Key.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const generatedPlan = await generateTrainingPlan(data);
      setPlan(generatedPlan);
      // Save to local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(generatedPlan));
    } catch (err: any) {
      setError(err.message || "Виникла помилка при генерації плану. Перевірте API ключ.");
      // Якщо помилка пов'язана з доступом, відкриваємо налаштування
      if (err.message && (err.message.includes("403") || err.message.includes("400") || err.message.includes("КЛЮЧ"))) {
          setShowSettings(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Ви впевнені? Поточний план буде видалено з пам'яті.")) {
        setPlan(null);
        setError(null);
        localStorage.removeItem(STORAGE_KEY);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saveApiKey = () => {
    if (!userApiKey.trim()) {
        localStorage.removeItem(API_KEY_STORAGE);
    } else {
        localStorage.setItem(API_KEY_STORAGE, userApiKey.trim());
    }
    setShowSettings(false);
    // Скидаємо статус перевірки при закритті
    setKeyStatus('idle');
    setKeyErrorMsg('');
    setError(null); // Очищаємо старі помилки
  };
  
  const checkConnection = async () => {
    // Якщо поле пусте, перевіряємо чи є hardcoded ключ
    const keyToTest = userApiKey.trim() || process.env.API_KEY;
    
    if (!keyToTest) {
        setKeyStatus('invalid');
        setKeyErrorMsg("Введіть ключ для перевірки.");
        return;
    }
    
    setCheckingKey(true);
    setKeyStatus('idle');
    setKeyErrorMsg('');
    
    try {
        await validateApiKey(keyToTest);
        setKeyStatus('valid');
    } catch (e: any) {
        setKeyStatus('invalid');
        setKeyErrorMsg(e.message || "Невідома помилка");
    } finally {
        setCheckingKey(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-stone-950 text-stone-200">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-amber-500">
                            <KeyRound className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Налаштування API</h3>
                        </div>
                        <button onClick={() => setShowSettings(false)} className="text-stone-500 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <p className="text-stone-400 text-sm mb-4 leading-relaxed">
                        Щоб користуватися генератором, введіть ваш власний ключ Google Gemini API.
                    </p>

                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium mb-4 hover:underline"
                    >
                        <span>Отримати ключ (створюйте New Project!)</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="space-y-2 mb-4">
                        <label className="block text-xs font-bold text-stone-500 uppercase">Ваш API Key</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={userApiKey}
                                onChange={(e) => {
                                    setUserApiKey(e.target.value);
                                    setKeyStatus('idle'); 
                                }}
                                placeholder={process.env.API_KEY ? "Вшитий ключ активний (можна замінити)" : "Вставте ключ тут (AIzaSy...)"}
                                className={`w-full bg-black/50 border rounded-lg p-3 pr-24 text-stone-200 font-mono text-sm focus:outline-none focus:ring-1 transition-all ${
                                    keyStatus === 'valid' ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500' :
                                    keyStatus === 'invalid' ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' :
                                    'border-stone-700 focus:border-amber-500 focus:ring-amber-500'
                                }`}
                            />
                            
                            <button
                                onClick={checkConnection}
                                disabled={checkingKey}
                                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {checkingKey ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    "Перевірити"
                                )}
                            </button>
                        </div>
                        {process.env.API_KEY && !userApiKey && (
                            <p className="text-[10px] text-emerald-500/80 flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Використовується вшитий ключ (DEV mode)
                            </p>
                        )}
                    </div>
                    
                    {/* Key Validation Feedback */}
                    {keyStatus === 'valid' && (
                        <div className="mb-4 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg flex items-center gap-2 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Ключ працює!</span>
                        </div>
                    )}
                    
                    {keyStatus === 'invalid' && (
                        <div className="mb-4 p-3 bg-red-950/20 border border-red-900/50 rounded-lg flex items-start gap-2 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="overflow-hidden break-words w-full">
                                <span className="font-bold block mb-1">Помилка:</span>
                                <span className="text-xs opacity-90 font-mono leading-tight block">{keyErrorMsg}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                         <button 
                            onClick={() => {
                                setUserApiKey('');
                                localStorage.removeItem(API_KEY_STORAGE);
                                setKeyStatus('idle');
                            }}
                            className="px-4 py-3 rounded-lg border border-stone-700 text-stone-400 hover:bg-stone-800 hover:text-white transition-all"
                            title="Очистити поле"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={saveApiKey}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <Save className="w-4 h-4" />
                            Зберегти
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Navbar */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-50 shadow-md print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center select-none">
            {/* SapperHub Style Logo */}
            <div className="flex items-center tracking-tighter font-bold text-2xl md:text-3xl">
                <span className="text-white">Sapper</span>
                <span className="bg-[#FF9900] text-black px-2 py-0.5 rounded ml-0.5 border border-[#FF9900] shadow-[0_0_10px_rgba(255,153,0,0.3)]">Hub</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
              {plan && (
                 <div className="hidden md:flex items-center gap-1.5 text-[10px] uppercase font-mono text-emerald-500 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50 animate-in fade-in">
                    <History className="w-3 h-3" />
                    <span className="hidden sm:inline">Збережено</span>
                 </div>
              )}
              
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-stone-400 hover:text-amber-500 hover:bg-stone-800 rounded-full transition-all relative group"
                title="Налаштування API"
              >
                <Settings className="w-5 h-5" />
                {userApiKey && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-emerald-500 rounded-full border border-stone-900"></span>
                )}
              </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 md:px-4 py-6 md:py-12 print:py-0 print:px-0 print:max-w-none">
        
        {/* Error Banner */}
        {error && (
            <div className="max-w-3xl mx-auto mb-8 bg-red-950/20 border border-red-900/50 p-4 rounded-lg flex items-start gap-3 text-red-400 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-red-900/10">
                <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="w-full">
                    <h4 className="font-bold text-sm uppercase mb-1">Помилка генерації</h4>
                    <p className="text-sm opacity-90 font-mono">{error}</p>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="mt-3 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-200 px-3 py-1.5 rounded border border-red-800 transition-colors"
                    >
                        Налаштувати ключ
                    </button>
                </div>
            </div>
        )}

        {!plan ? (
            <div className="animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-6 md:mb-10 px-2">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
                        Планування бойової підготовки
                    </h2>
                    <p className="text-stone-400 max-w-xl mx-auto text-sm md:text-lg leading-relaxed">
                        Автоматизоване створення навчальних планів для інженерно-саперних підрозділів. Швидко, чітко, з телефону.
                    </p>
                </div>
                <InputForm onSubmit={handleFormSubmit} isLoading={loading} />
            </div>
        ) : (
            <PlanDisplay 
                plan={plan} 
                onReset={handleReset} 
                onOpenSettings={() => setShowSettings(true)}
            />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900 py-6 md:py-8 mt-auto text-center px-4 print:hidden">
        <p className="text-stone-600 text-xs md:text-sm">
            © {new Date().getFullYear()} SapperHub v1.0.3. ПРИЗНАЧЕНО ДЛЯ СЛУЖБОВОГО КОРИСТУВАННЯ.
        </p>
      </footer>
    </div>
  );
};

export default App;
