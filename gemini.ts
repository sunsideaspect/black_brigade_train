import { GoogleGenAI } from "@google/genai";
import { TrainingFormData, TrainingPlanResponse, TrainingDay, TrainingModule } from "./types";

// ==========================================
// 1. CONFIG & MODELS
// ==========================================

const AVAILABLE_MODELS = [
  'gemini-2.0-flash',      // Найновіша стабільна версія (Пріоритет)
  'gemini-1.5-flash',      // Надійна "робоча конячка" (Резерв)
  'gemini-1.5-flash-8b',   // Швидка легка версія
  'gemini-2.0-flash-exp'   // Експериментальна
];

// ==========================================
// 2. FALLBACK DATABASE (OFFLINE MODE ONLY)
// ==========================================
const FALLBACK_DB: Record<string, TrainingModule[]> = {
  "Engineering": [
    {
      time: "08:00 - 10:00",
      subject: "ТТХ інженерних боєприпасів (ПМН/ОЗМ)",
      description: "Вивчення макетів. Ознаки встановлення. Принцип дії датчиків цілі.",
      type: "Theory",
      instructorTips: ["ПМН-2: час бойового положення 2-10 хв", "ОЗМ-72: радіус 25м"],
      questions: [{question: "Зусилля спрацювання ПМН-2?", answer: "5-25 кг"}]
    },
    {
      time: "10:15 - 13:00",
      subject: "Робота з щупом та розмінування",
      description: "Пророблення проходів. Робота 'кішкою' з укриття.",
      type: "Practice",
      instructorTips: ["Крок пошуку 2-3 см", "Кут входження щупа 30 град"],
      questions: [{question: "Безпечна відстань для кішки?", answer: "30-50 метрів"}]
    }
  ],
  "Tactics": [
    {
      time: "08:00 - 10:00",
      subject: "Маскування позицій від БПЛА",
      description: "Принципи антитеплового захисту. Робота в 'зеленці'.",
      type: "Theory",
      instructorTips: ["Використовувати природні навіси", "Не дивитись вгору відкритим обличчям"],
      questions: [{question: "Основний демаскувальний фактор?", answer: "Рух та правильні геометричні форми"}]
    },
    {
      time: "10:15 - 13:00",
      subject: "Окопування лежачи під вогнем",
      description: "Норматив №1. Створення укриття за 20 хв.",
      type: "Practice",
      instructorTips: ["Починати з ніг", "Зброя готова до бою"],
      questions: [{question: "Глибина окопу для стрільби лежачи?", answer: "30 см"}]
    }
  ],
  "Medicine": [
    {
      time: "08:00 - 12:00",
      subject: "Протокол MARCH (Масивні кровотечі)",
      description: "Накладання турнікету собі та побратиму. Контроль часу.",
      type: "Practice",
      instructorTips: ["Час накладання - до 30 сек", "Перевірка пульсу"],
      questions: [{question: "Де накладати турнікет?", answer: "Максимально високо"}]
    }
  ]
};

const generateFallbackPlan = (data: TrainingFormData): TrainingPlanResponse => {
  const days: TrainingDay[] = [];
  
  for (let i = 1; i <= data.durationDays; i++) {
    let themeKey = "Engineering";
    let themeTitle = "Інженерна підготовка";
    
    if (i % 3 === 0) { themeKey = "Medicine"; themeTitle = "Тактична медицина"; }
    else if (i % 2 === 0) { themeKey = "Tactics"; themeTitle = "Тактика та БПЛА"; }

    days.push({
      dayNumber: i,
      theme: themeTitle,
      objectives: ["Відпрацювання нормативів", "Робота з матчастиною"],
      safetyNotes: "Робота з ММГ. Дотримання дистанцій.",
      schedule: [
        ...FALLBACK_DB[themeKey],
        {
            time: "14:00 - 16:00",
            subject: "Комплексне тренування / Фізо",
            description: "Закріплення вивченого матеріалу у складі групи.",
            type: "Drill",
            instructorTips: ["Інтенсивність середня"],
            questions: []
        }
      ]
    });
  }

  return {
    title: "Базовий план підготовки (Резервний)",
    overview: "Увага: цей план згенеровано за шаблоном, оскільки зв'язок з AI-сервісом відсутній. Рекомендується перевірити підключення та спробувати згенерувати повний план знову.",
    days: days,
    isOffline: true
  };
};

// ==========================================
// 3. AI GENERATION LOGIC (MAIN)
// ==========================================

export const generateTrainingPlan = async (data: TrainingFormData): Promise<TrainingPlanResponse> => {
  const userKey = localStorage.getItem("user_gemini_api_key");
  const apiKey = (userKey && userKey.trim().length > 0) ? userKey : process.env.API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.warn("No API Key found. Returning fallback plan.");
    await new Promise(r => setTimeout(r, 1000));
    return generateFallbackPlan(data);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Role: Senior Military Instructor (Sapper/Engineer).
    Task: Create a rigorous training plan JSON for ${data.durationDays} days.
    Audience Level: ${data.experienceLevel}.
    Specific Focus Topics: ${JSON.stringify(data.focusAreas)}.
    User Notes: "${data.customNotes}".

    CRITICAL COMPRESSION RULE:
    The user has selected ${data.focusAreas.length} specific topics.
    You MUST cover ALL of these topics within the ${data.durationDays} days.
    - If the number of days is small, DO NOT skip topics.
    - Instead, shorten the time for each module or combine compatible topics (e.g., "Mines + Medevac" scenario).
    - It is acceptable to have shorter theory blocks to ensure everything is covered.
    - Every selected topic from the list MUST appear in the schedule at least once.

    REQUIREMENTS:
    1. STRICTLY MATCH THE THEME: Ensure the schedule content matches the day's theme.
    2. REALISM: Use real nomenclature (PMN-4, OZM-72, Mavic 3T, EW Spoofing).
    3. STRUCTURE:
       - Day Theme (Title)
       - The schedule array can have 2-4 modules depending on how much needs to be packed in.
    4. LANGUAGE: Ukrainian (Military terminology).

    JSON SCHEMA:
    {
      "title": "String (Course Name)",
      "overview": "String (Brief summary stating that all selected topics are covered)",
      "days": [
        {
          "dayNumber": Integer,
          "theme": "String (Main Topic of the day)",
          "objectives": ["String", "String"],
          "safetyNotes": "String (Critical safety warnings)",
          "schedule": [
            {
              "time": "String (e.g. 08:00 - 09:30)",
              "subject": "String",
              "description": "String (Detailed exercise description)",
              "type": "Theory" | "Practice" | "Drill",
              "instructorTips": ["String (Technical specs or teaching advice)"],
              "questions": [{"question": "String", "answer": "String"}] (Exactly 2-3 control questions)
            }
          ]
        }
      ]
    }
  `;

  let lastError = null;

  for (const modelName of AVAILABLE_MODELS) {
    try {
      console.log(`Attempting generation with ${modelName}...`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4, 
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");
      
      const parsed = JSON.parse(text) as TrainingPlanResponse;
      
      if (!parsed.days || parsed.days.length === 0) throw new Error("Invalid JSON structure");

      return parsed;

    } catch (e: any) {
      console.warn(`Failed with ${modelName}:`, e.message);
      lastError = e;
      
      const msg = e.message || '';

      if (msg.includes("leaked") || msg.includes("compromised")) {
         throw new Error("⛔ КЛЮЧ ЗАБЛОКОВАНО: Google виявив цей ключ у публічному доступі. Створіть новий ключ у новому проєкті і не публікуйте його.");
      }

      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
          console.log(`Model ${modelName} is exhausted, trying next...`);
          continue;
      }

      // 404 is common for new keys on old models, try next
      if (msg.includes('404') || msg.includes('not found')) {
          continue; 
      }

      if (msg.includes('403') || msg.includes('400') || msg.includes('key') || msg.includes('PERMISSION_DENIED')) {
         const isLastModel = modelName === AVAILABLE_MODELS[AVAILABLE_MODELS.length - 1];
         if (isLastModel) {
             throw new Error("Помилка доступу. Перевірте API ключ (або створіть новий проект в Google AI Studio).");
         }
      }
    }
  }

  console.error("All AI models failed.", lastError);
  
  let finalErrorMsg = lastError?.message || 'Помилка з\'єднання з AI';
  if (finalErrorMsg.includes("429")) {
      finalErrorMsg = "Перевищено ліміт запитів (429). Спробуйте зачекати хвилину або використайте інший Google акаунт.";
  }
  
  throw new Error(finalErrorMsg);
};

export const validateApiKey = async (apiKey: string): Promise<void> => {
    const ai = new GoogleGenAI({ apiKey });
    
    // Перевіряємо кілька моделей по черзі
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: any = null;
    let isSuccess = false;

    for (const model of modelsToTry) {
        try {
            await ai.models.generateContent({ 
                model: model, 
                contents: 'ping' 
            });
            isSuccess = true;
            break; 
        } catch (e: any) {
            console.warn(`Validation failed for ${model}:`, e.message);
            lastError = e;
            const msg = e.message || "";
            if (msg.includes("INVALID_ARGUMENT") || msg.includes("leaked")) {
                 break; 
            }
        }
    }

    if (isSuccess) return;

    console.error("API Key Validation Final Error:", lastError);
    let errorMsg = lastError?.message || "Невідома помилка";
     
    if (errorMsg.includes("leaked")) errorMsg = "⛔ КЛЮЧ ЗАБЛОКОВАНО: Він потрапив у публічний доступ. Створіть новий.";
    else if (errorMsg.includes("400")) errorMsg = "Невірний формат ключа (Error 400).";
    else if (errorMsg.includes("403")) errorMsg = "Відмовлено в доступі (Error 403). Перевірте права.";
    else if (errorMsg.includes("404")) errorMsg = "Модель не знайдена (Error 404). Спробуйте створити ключ у новому проєкті Google Cloud.";
    else if (errorMsg.includes("429")) errorMsg = "Перевищено ліміт (Error 429). Спробуйте пізніше.";
    
    throw new Error(errorMsg);
};