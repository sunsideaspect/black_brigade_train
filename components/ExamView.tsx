import React, { useState, useEffect } from 'react';
import { TrainingPlanResponse, QuizItem } from '../types';
import { ChevronRight, ChevronLeft, Eye, EyeOff, X, Trophy, BrainCircuit } from 'lucide-react';

interface ExamViewProps {
  plan: TrainingPlanResponse;
  onClose: () => void;
}

export const ExamView: React.FC<ExamViewProps> = ({ plan, onClose }) => {
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Extract and shuffle questions on mount
  useEffect(() => {
    const allQuestions: QuizItem[] = [];
    plan.days.forEach(day => {
      day.schedule.forEach(module => {
        if (module.questions) {
          allQuestions.push(...module.questions);
        }
      });
    });
    // Shuffle
    setQuestions(allQuestions.sort(() => Math.random() - 0.5));
  }, [plan]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  if (questions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950 flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-stone-900/50 backdrop-blur-md border-b border-stone-800">
        <div className="flex items-center gap-2 text-amber-500 font-mono font-bold">
            <BrainCircuit className="w-5 h-5" />
            <span>РЕЖИМ ЕКЗАМЕНУ</span>
        </div>
        <button 
            onClick={onClose}
            className="p-2 bg-stone-800 rounded-full text-stone-400 hover:text-white hover:bg-red-900/50 transition-colors"
        >
            <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="w-full max-w-lg relative">
        {!isFinished ? (
            <div className="relative">
                {/* Progress Bar */}
                <div className="mb-6 flex items-center justify-between text-xs font-mono text-stone-500 uppercase tracking-widest">
                    <span>Питання {currentIndex + 1} з {questions.length}</span>
                    <div className="flex gap-1">
                        {questions.map((_, i) => (
                            <div key={i} className={`h-1 w-3 rounded-full transition-colors ${i <= currentIndex ? 'bg-amber-500' : 'bg-stone-800'}`} />
                        ))}
                    </div>
                </div>

                {/* Card */}
                <div 
                    className="bg-stone-900 border border-stone-700 rounded-2xl p-6 md:p-10 min-h-[300px] flex flex-col items-center justify-center text-center shadow-2xl shadow-black relative overflow-hidden"
                    onClick={() => setShowAnswer(!showAnswer)}
                >
                    <div className="absolute top-4 right-4 text-stone-600">
                        {showAnswer ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-stone-200 mb-6 leading-relaxed">
                        {questions[currentIndex].question}
                    </h3>

                    <div className={`transition-all duration-500 transform ${showAnswer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <div className="h-px w-12 bg-stone-700 mx-auto mb-6"></div>
                        <p className="text-lg md:text-xl text-emerald-400 font-mono font-medium">
                            {questions[currentIndex].answer}
                        </p>
                    </div>

                    {!showAnswer && (
                        <p className="absolute bottom-6 text-xs text-stone-600 animate-pulse">
                            Натисніть, щоб побачити відповідь
                        </p>
                    )}
                </div>

                {/* Controls */}
                <div className="mt-8 flex gap-4 justify-center">
                    <button 
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="p-4 rounded-full bg-stone-800 border border-stone-700 text-stone-400 disabled:opacity-30 hover:bg-stone-700 hover:text-white transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={handleNext}
                        className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:scale-[0.98] transition-all"
                    >
                        {currentIndex === questions.length - 1 ? 'Завершити' : 'Наступне'}
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        ) : (
            <div className="text-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-500">
                    <Trophy className="w-12 h-12 text-amber-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Перевірку завершено!</h2>
                <p className="text-stone-400 mb-8">Всі питання пройдено. Можна починати спочатку.</p>
                <button 
                    onClick={onClose}
                    className="w-full py-4 bg-stone-800 border border-stone-700 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition-all"
                >
                    Повернутися до плану
                </button>
            </div>
        )}
      </div>
    </div>
  );
};