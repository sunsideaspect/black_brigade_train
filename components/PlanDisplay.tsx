import React, { useState } from 'react';
import { TrainingPlanResponse, TrainingDay, TrainingModule, QuizItem } from '../types';
import { Download, ShieldAlert, BookOpen, Hammer, Zap, RotateCcw, Printer, ChevronDown, ListChecks, Copy, Check, ExternalLink, Search, HelpCircle, Eye, ClipboardList, BrainCircuit, FileDown, WifiOff, Settings } from 'lucide-react';
import { ExamView } from './ExamView';

interface PlanDisplayProps {
  plan: TrainingPlanResponse;
  onReset: () => void;
  onOpenSettings: () => void;
}

const ModuleIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Theory': return <BookOpen className="w-4 h-4 text-blue-400 print:text-black" />;
    case 'Practice': return <Hammer className="w-4 h-4 text-emerald-400 print:text-black" />;
    case 'Drill': return <Zap className="w-4 h-4 text-amber-400 print:text-black" />;
    default: return <div className="w-4 h-4 bg-stone-600 rounded-full print:bg-black" />;
  }
};

// Utility to render text with clickable links AND Search Queries
const LinkedText: React.FC<{ text: string }> = ({ text }) => {
  const searchMatch = text.match(/[🔍🔎]?\s*Пошук:\s*(.+)/i);
  
  if (searchMatch) {
    const query = searchMatch[1];
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    return (
       <a 
         href={searchUrl}
         target="_blank" 
         rel="noopener noreferrer"
         className="text-amber-400 hover:text-amber-300 font-medium hover:underline underline-offset-4 decoration-amber-500/50 inline-flex items-center gap-1.5 break-words transition-all bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 hover:border-amber-500/50 print:no-underline print:text-black print:border-none print:bg-transparent print:p-0"
         onClick={(e) => e.stopPropagation()}
       >
         <Search className="w-3.5 h-3.5 shrink-0 print:hidden" />
         {text.replace(/^[🔍🔎]?\s*/, '')}
       </a>
    );
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <span>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a 
              key={i} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 inline-flex items-center gap-1 mx-1 break-all hover:bg-blue-500/10 rounded px-1 -ml-1 transition-all print:text-black print:no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part.length > 35 ? part.substring(0, 32) + '...' : part}
              <ExternalLink className="w-3 h-3 inline print:hidden" />
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const QuizBlock: React.FC<{ questions: QuizItem[] }> = ({ questions }) => {
    return (
        <div className="mt-4 pt-4 border-t border-stone-700/50 print:border-gray-300">
            <div className="flex items-center gap-2 mb-3 text-emerald-500 print:text-black">
                <HelpCircle className="w-5 h-5 print:hidden" />
                <span className="text-sm font-bold uppercase tracking-widest">Перевірка знань</span>
            </div>
            <div className="space-y-3">
                {questions.map((q, idx) => (
                    <div key={idx} className="bg-stone-900/50 rounded p-3 border border-stone-800 print:bg-white print:border-gray-300">
                        <p className="text-stone-200 font-medium mb-2 text-sm md:text-base print:text-black">
                            <span className="text-emerald-500/70 mr-2 print:text-black">{idx + 1}.</span>
                            {q.question}
                        </p>
                        {/* Spoiler Answer - Always visible in print */}
                        <div className="group relative cursor-pointer select-none print:hidden">
                            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1 group-hover:opacity-0 transition-opacity absolute -top-1 left-0">
                                <Eye className="w-3 h-3" /> Показати відповідь
                            </div>
                            <div className="bg-stone-800 rounded px-3 py-2 mt-1 text-sm text-emerald-400 font-mono blur-[6px] group-hover:blur-0 transition-all duration-300 group-active:blur-0">
                                {q.answer}
                            </div>
                        </div>
                        {/* Print only answer */}
                        <div className="hidden print:block text-sm font-mono mt-1 pl-4 border-l-2 border-gray-300">
                            Відповідь: {q.answer}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Sub-component for individual schedule items to manage expansion state
const ScheduleItem: React.FC<{ module: TrainingModule; isLast: boolean }> = ({ module, isLast }) => {
  const [isOpen, setIsOpen] = useState(false);

  // In print mode, always show details
  const isExpanded = isOpen; 

  return (
    <div className="relative flex flex-col md:flex-row group break-inside-avoid print:break-inside-avoid">
      
      {/* Mobile Time (Top of card) */}
      <div className="md:hidden flex items-center gap-2 mb-1.5 print:hidden">
         <span className="font-mono text-sm bg-stone-800 text-amber-500 px-2 py-0.5 rounded font-bold">
           {module.time}
         </span>
         <div className="h-px bg-stone-800 flex-grow"></div>
      </div>

      {/* Desktop/Print Time (Left side) */}
      <div className="hidden md:flex print:flex w-[85px] shrink-0 flex-col items-end pr-6 py-4 text-right">
        <span className="font-mono text-sm text-amber-500/80 font-bold print:text-black">{module.time}</span>
      </div>

      {/* Desktop Timeline Dot */}
      <div className={`hidden md:block print:block absolute left-[81px] top-5 w-2.5 h-2.5 rounded-full z-10 transition-colors duration-300 print:bg-black print:border-none ${isOpen ? 'bg-amber-500 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-stone-600 border-stone-900 group-hover:bg-stone-500 border-2'}`}></div>

      {/* Content Card (Clickable) */}
      <div className="flex-1 md:pl-6 md:py-2">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-left transition-all duration-300 rounded-lg border overflow-hidden relative cursor-pointer print:cursor-auto print:border-none print:shadow-none print:bg-transparent ${
            isOpen 
            ? 'bg-stone-800 border-amber-500/50 shadow-lg shadow-black/50' 
            : 'bg-stone-800/20 border-stone-800 hover:border-stone-700 active:bg-stone-800/40'
          }`}
        >
          <div className="p-4 md:p-5 print:p-0 print:pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ModuleIcon type={module.type} />
                  <span className={`text-[11px] uppercase font-bold tracking-wider print:text-black ${
                    module.type === 'Theory' ? 'text-blue-400' : 
                    module.type === 'Practice' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {module.type === 'Theory' ? 'Теорія' : module.type === 'Practice' ? 'Практика' : 'Тренування'}
                  </span>
                </div>
                <h4 className={`font-semibold text-lg leading-snug transition-colors print:text-black ${isOpen ? 'text-amber-500' : 'text-stone-100'}`}>
                  {module.subject}
                </h4>
                <p className="text-sm text-stone-400 leading-relaxed mt-1.5 print:text-black">{module.description}</p>
              </div>
              
              <ChevronDown className={`w-6 h-6 text-stone-600 transition-transform duration-300 shrink-0 mt-1 print:hidden ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
            </div>

            {/* Instructor Tips (Accordion Content) - Always visible in print */}
            <div className={`grid transition-all duration-300 ease-in-out print:block ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0 print:opacity-100 print:grid-rows-[1fr] print:mt-2'}`}>
               <div className="overflow-hidden">
                  <div className="bg-black/40 rounded border border-stone-700/50 p-4 md:p-5 relative print:bg-white print:border-l-2 print:border-gray-300 print:border-t-0 print:border-r-0 print:border-b-0 print:rounded-none print:pl-4 print:py-0">
                     <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500/60 rounded-l print:hidden"></div>
                     
                     {/* Resources Section */}
                     <div className="flex items-center gap-2 mb-4 text-amber-500 print:text-black print:mb-2">
                        <ListChecks className="w-5 h-5 print:hidden" />
                        <span className="text-sm font-bold uppercase tracking-widest">Матеріали</span>
                     </div>
                     
                     {module.instructorTips && module.instructorTips.length > 0 ? (
                        <ul className="space-y-3 print:space-y-1">
                            {module.instructorTips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-stone-200 print:text-black">
                                    <span className="text-amber-500/70 mt-1.5 text-[10px] shrink-0 print:text-black">●</span>
                                    <span className="text-base leading-relaxed md:text-lg w-full print:text-sm">
                                        <LinkedText text={tip} />
                                    </span>
                                </li>
                            ))}
                        </ul>
                     ) : (
                        <p className="text-stone-500 italic print:text-black">Інформація відсутня.</p>
                     )}

                     {/* Quiz Section (If questions exist) */}
                     {module.questions && module.questions.length > 0 && (
                        <QuizBlock questions={module.questions} />
                     )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DayCard: React.FC<{ day: TrainingDay }> = ({ day }) => {
  const [copied, setCopied] = useState(false);

  const copyForSignal = () => {
    const lines = [
      `🗓 *ДЕНЬ ${day.dayNumber} | ${day.theme.toUpperCase()}*`,
      "",
      `⚠️ *ТБ:* ${day.safetyNotes}`,
      "",
      ...day.schedule.map(s => `🔹 ${s.time} - ${s.subject} (${s.type === 'Practice' ? 'Полігон' : 'Клас'})`)
    ];
    
    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden mb-6 shadow-lg shadow-black/40 break-inside-avoid print:bg-white print:border-2 print:border-black print:shadow-none print:mb-8">
      {/* Day Header */}
      <div className="bg-stone-800/50 p-4 border-b border-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-3 print:bg-white print:border-b print:border-black">
        <div>
          <h3 className="text-xl font-bold text-amber-500 font-mono flex items-center gap-2 print:text-black">
            ДЕНЬ {day.dayNumber} 
            <span className="hidden md:inline text-stone-600 print:text-black">|</span>
            <span className="text-stone-200 text-lg font-sans font-medium block md:inline print:text-black">{day.theme}</span>
          </h3>
        </div>
        
        <div className="flex items-center gap-2 justify-between md:justify-end w-full md:w-auto print:hidden">
            <div className="flex flex-wrap gap-2">
            {day.objectives.map((obj, idx) => (
                <span key={idx} className="text-[10px] md:text-[11px] bg-stone-950 text-stone-400 px-2 py-1 rounded border border-stone-700 hidden sm:inline-block">
                {obj}
                </span>
            ))}
            </div>
            
            <button 
                onClick={copyForSignal}
                className={`ml-auto md:ml-2 flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-wider transition-all ${
                    copied 
                    ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400' 
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                }`}
            >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Скопійовано' : 'В Signal'}
            </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Safety Warning */}
        <div className="mb-6 bg-red-950/20 border-l-4 border-red-600/80 p-3 md:p-4 rounded-r flex items-start gap-3 print:bg-white print:border-red-600 print:border">
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5 print:text-red-600" />
          <div>
            <h4 className="font-bold text-red-400 text-sm uppercase mb-1 print:text-red-600">Заходи безпеки</h4>
            <p className="text-stone-300 text-sm leading-relaxed print:text-black">{day.safetyNotes}</p>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4 md:space-y-0 md:relative">
            {/* Desktop Timeline Line */}
            <div className="absolute left-[85px] top-2 bottom-2 w-0.5 bg-stone-800 hidden md:block print:bg-gray-300"></div>
            
            {day.schedule.map((module, idx) => (
              <ScheduleItem 
                key={idx} 
                module={module} 
                isLast={idx === day.schedule.length - 1} 
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, onReset, onOpenSettings }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [isExamMode, setIsExamMode] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const copyFullPlan = () => {
    const header = `📋 ПЛАН ПІДГОТОВКИ: ${plan.title.toUpperCase()}\n\n${plan.overview}\n\n====================\n`;
    
    const body = plan.days.map(day => {
        const dayHeader = `🗓 ДЕНЬ ${day.dayNumber}: ${day.theme.toUpperCase()}`;
        const safety = `⚠️ ТБ: ${day.safetyNotes}`;
        const modules = day.schedule.map(s => 
            `🔹 ${s.time} | ${s.subject} (${s.type === 'Practice' ? 'Полігон' : 'Клас'})`
        ).join('\n');
        
        return `${dayHeader}\n${safety}\n${modules}\n`;
    }).join('\n====================\n\n');

    const fullText = header + body + "\nЗгенеровано через SapperHub";

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <>
    {isExamMode && <ExamView plan={plan} onClose={() => setIsExamMode(false)} />}
    <div className={`max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 print:pb-0 print:max-w-none print:w-full ${isExamMode ? 'blur-sm pointer-events-none' : ''}`}>
      
      {/* Offline Alert Banner */}
      {plan.isOffline && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/50 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 rounded-full shrink-0">
                    <WifiOff className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-amber-200 font-bold text-sm uppercase">Автономний режим</h3>
                    <p className="text-amber-500/80 text-sm">Зв'язок з ШІ відсутній. Показано шаблонний план.</p>
                </div>
            </div>
            <button 
                onClick={onOpenSettings}
                className="w-full md:w-auto px-4 py-2 bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 text-sm font-medium rounded border border-amber-500/30 flex items-center justify-center gap-2 transition-colors"
            >
                <Settings className="w-4 h-4" />
                Налаштувати API
            </button>
        </div>
      )}

      {/* Header & Actions */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-800 pb-6 print:border-none print:mb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-stone-100 mb-3 print:text-black">{plan.title}</h2>
          <p className="text-stone-400 text-sm md:text-base max-w-2xl leading-relaxed print:text-black">{plan.overview}</p>
        </div>
        
        {/* Buttons: Stacked on mobile, Row on desktop */}
        <div className="flex flex-col sm:flex-row gap-3 print:hidden w-full md:w-auto">
            <button 
                onClick={onReset}
                className="order-4 sm:order-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-medium text-stone-400 bg-stone-900 border border-stone-800 rounded-lg hover:bg-stone-800 hover:text-stone-100 transition-all active:scale-[0.98]"
            >
                <RotateCcw className="w-4 h-4" />
                Новий
            </button>
            
            <button 
                onClick={() => setIsExamMode(true)}
                className="order-1 sm:order-2 flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-bold bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/50 rounded-lg transition-all active:scale-[0.98] shadow-[0_0_10px_rgba(16,185,129,0.1)]"
            >
                <BrainCircuit className="w-4 h-4" />
                Екзамен
            </button>

            <button 
                onClick={copyFullPlan}
                className={`order-2 sm:order-3 flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-bold border rounded-lg transition-all active:scale-[0.98] ${
                    copiedAll 
                    ? 'bg-stone-800 border-stone-600 text-stone-300' 
                    : 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                }`}
            >
                {copiedAll ? <Check className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                {copiedAll ? 'Готово' : 'Копіювати'}
            </button>

            <button 
                onClick={handlePrint}
                className="order-3 sm:order-4 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-stone-950 px-6 py-3 sm:py-2 rounded-lg font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-[0.98]"
            >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Зберегти PDF</span>
            </button>
        </div>
      </div>

      {/* Days Loop */}
      <div className="space-y-4">
        {plan.days.map((day) => (
          <DayCard key={day.dayNumber} day={day} />
        ))}
      </div>
      
      {/* Print Footer Hint */}
      <div className="text-center mt-12 text-stone-600 text-sm print:hidden">
         <div className="flex items-center justify-center gap-2 mb-2">
            <Printer className="w-4 h-4" />
            <span>Підказка:</span>
         </div>
         <p>У вікні друку оберіть "Зберегти як PDF" (Save as PDF)</p>
      </div>
    </div>
    </>
  );
};