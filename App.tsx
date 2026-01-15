import React, { useState, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { PlanDisplay } from './components/PlanDisplay';
import { generateTrainingPlan, validateApiKey } from './gemini';
import { TrainingFormData, TrainingPlanResponse } from './types';
import { TriangleAlert, History, Settings, X, KeyRound, ExternalLink, Save, CheckCircle2, XCircle, Loader2, RefreshCcw, WifiOff } from 'lucide-react';

const STORAGE_KEY = 'sapper_hub_last_plan';
const API_KEY_STORAGE = 'user_gemini_api_key';

const App: React.FC = () => {
  const [plan, setPlan] = useState<TrainingPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  
  // Validation
  const [checkingKey, setCheckingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [keyErrorMsg, setKeyErrorMsg] = useState('');

  useEffect(() => {
    // Load saved plan
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            setPlan(JSON.parse(saved));
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    // Load saved key
    const savedKey = localStorage.getItem(API_KEY_STORAGE);
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  const handleFormSubmit = async (data: TrainingFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Викликаємо генератор. Він САМ вирішить, використовувати АІ чи віддати шаблон.
      const generatedPlan = await generateTrainingPlan(data);
      setPlan(generatedPlan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(generatedPlan));
    } catch (err: any) {
      // Цей блок спрацює тільки якщо впав навіть Fallback (що малоймовірно)
      console.error(err);
      setError("Критична помилка програми. Спробуйте оновити сторінку.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Створити новий план? Поточний буде втрачено.")) {
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
    setKeyStatus('idle');
  };
  
  const checkConnection = async () => {
    const keyToTest = userApiKey.trim() || process.env.API_KEY || "";
    if (!keyToTest) {
        setKeyStatus('invalid');
        setKeyErrorMsg("Введіть ключ");
        return;
    }
    setCheckingKey(true);
    setKeyStatus('idle');
    try {
        await validateApiKey(keyToTest);
        setKeyStatus('valid');
    } catch (e: any) {
        setKeyStatus('invalid');
        setKeyErrorMsg(e.message);
    } finally {
        setCheckingKey(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-stone-950 text-stone-200">
      
      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-md shadow-2xl relative">
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

                    <div className="mb-4 bg-stone-800/50 p-3 rounded text-xs text-stone-400">
                        <p className="mb-2">Якщо API не працює, система автоматично перейде в <strong>Автономний режим</strong> (шаблони).</p>
                    </div>

                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm flex items-center gap-1 mb-4">
                        <span>Отримати ключ Google AI</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="space-y-2 mb-4">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={userApiKey}
                                onChange={(e) => { setUserApiKey(e.target.value); setKeyStatus('idle'); }}
                                placeholder="Вставте ключ тут..."
                                className={`w-full bg-black/50 border rounded-lg p-3 pr-24 text-sm font-mono focus:outline-none ${
                                    keyStatus === 'valid' ? 'border-emerald-500' : 
                                    keyStatus === 'invalid' ? 'border-red-500' : 'border-stone-700 focus:border-amber-500'
                                }`}
                            />
                            <button
                                onClick={checkConnection}
                                disabled={checkingKey}
                                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-stone-800 hover:bg-stone-700 text-xs font-bold rounded flex items-center gap-2"
                            >
                                {checkingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : "Перевірити"}
                            </button>
                        </div>
                    </div>
                    
                    {keyStatus === 'invalid' && (
                        <p className="text-red-400 text-xs mb-4 flex items-center gap-1"><XCircle className="w-3 h-3"/> {keyErrorMsg}</p>
                    )}
                    {keyStatus === 'valid' && (
                        <p className="text-emerald-400 text-xs mb-4 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ключ активний</p>
                    )}

                    <button onClick={saveApiKey} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> Зберегти
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center tracking-tighter font-bold text-2xl md:text-3xl select-none">
            <span className="text-white">Sapper</span>
            <span className="bg-[#FF9900] text-black px-2 py-0.5 rounded ml-0.5 border border-[#FF9900]">Hub</span>
          </div>
          <div className="flex items-center gap-4">
             {/* Індикатор офлайн режиму в шапці, якщо план завантажений */}
             {plan?.isOffline && (
                 <div className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-500 bg-amber-950/30 px-2 py-1 rounded border border-amber-900/50">
                    <WifiOff className="w-3 h-3" />
                    <span>Offline</span>
                 </div>
             )}
             <button onClick={() => setShowSettings(true)} className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-full transition-all">
                <Settings className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-3 md:px-4 py-6 md:py-12">
        {error && (
            <div className="max-w-3xl mx-auto mb-8 bg-red-950/20 border border-red-900/50 p-4 rounded-lg flex items-start gap-3 text-red-400">
                <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
            </div>
        )}

        {!plan ? (
            <div className="animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-6 md:mb-10 px-2">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">Планування бойової підготовки</h2>
                    <p className="text-stone-400 max-w-xl mx-auto text-sm md:text-lg">
                        Генерація планів для інженерних підрозділів. <br/>
                        <span className="text-amber-500/80 text-xs md:text-sm">(Працює навіть без стабільного зв'язку з ШІ)</span>
                    </p>
                </div>
                <InputForm onSubmit={handleFormSubmit} isLoading={loading} />
            </div>
        ) : (
            <PlanDisplay plan={plan} onReset={handleReset} onOpenSettings={() => setShowSettings(true)} />
        )}
      </main>

      <footer className="border-t border-stone-900 py-6 mt-auto text-center px-4">
        <p className="text-stone-600 text-xs md:text-sm">© {new Date().getFullYear()} SapperHub. ПРИЗНАЧЕНО ДЛЯ СЛУЖБОВОГО КОРИСТУВАННЯ.</p>
      </footer>
    </div>
  );
};

export default App;