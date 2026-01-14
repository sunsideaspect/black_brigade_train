import React, { useState, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { PlanDisplay } from './components/PlanDisplay';
import { generateTrainingPlan } from './services/geminiService';
import { TrainingFormData, TrainingPlanResponse } from './types';
import { TriangleAlert, History, Settings, X, KeyRound, ExternalLink, Save } from 'lucide-react';

const STORAGE_KEY = 'sapper_hub_last_plan';
const API_KEY_STORAGE = 'user_gemini_api_key';

const App: React.FC = () => {
  const [plan, setPlan] = useState<TrainingPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');

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
    setLoading(true);
    setError(null);
    try {
      const generatedPlan = await generateTrainingPlan(data);
      setPlan(generatedPlan);
      // Save to local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(generatedPlan));
    } catch (err: any) {
      setError(err.message || "Виникла помилка при генерації плану. Перевірте API ключ.");
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
    alert("Ключ збережено! Тепер ліміти не будуть проблемою.");
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
                        Якщо ви бачите помилку 429 (ліміти), введіть свій власний безкоштовний ключ Gemini. Це гарантує стабільну роботу.
                    </p>

                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium mb-4 hover:underline"
                    >
                        <span>Отримати ключ тут (Google AI Studio)</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="space-y-2 mb-6">
                        <label className="block text-xs font-bold text-stone-500 uppercase">Ваш API Key</label>
                        <input 
                            type="password" 
                            value={userApiKey}
                            onChange={(e) => setUserApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-black/50 border border-stone-700 rounded-lg p-3 text-stone-200 font-mono text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                    </div>

                    <button 
                        onClick={saveApiKey}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <Save className="w-4 h-4" />
                        Зберегти
                    </button>
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
            <div className="max-w-2xl mx-auto mb-8 bg-red-950/20 border border-red-900/50 p-4 rounded-lg flex items-center gap-3 text-red-400">
                <TriangleAlert className="w-5 h-5 shrink-0" />
                <p>{error}</p>
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
            <PlanDisplay plan={plan} onReset={handleReset} />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900 py-6 md:py-8 mt-auto text-center px-4 print:hidden">
        <p className="text-stone-600 text-xs md:text-sm">
            © {new Date().getFullYear()} SapperHub v1.0.2. ПРИЗНАЧЕНО ДЛЯ СЛУЖБОВОГО КОРИСТУВАННЯ.
        </p>
      </footer>
    </div>
  );
};

export default App;