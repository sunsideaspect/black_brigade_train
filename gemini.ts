import { GoogleGenAI } from "@google/genai";
import { TrainingFormData, TrainingPlanResponse, TrainingDay, TrainingModule } from "./types";

// ==========================================
// 1. КОНФІГУРАЦІЯ ТА МОДЕЛІ
// ==========================================

const AVAILABLE_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
];

// ==========================================
// 2. РЕЗЕРВНА БАЗА ДАНИХ (ОФЛАЙН РЕЖИМ)
// ==========================================
const FALLBACK_DB: Record<string, TrainingModule[]> = {
  "Engineering": [
    {
      time: "08:00 - 09:30",
      subject: "ТТХ та будова інженерних боєприпасів",
      description: "Вивчення матеріальної частини: ПМН-2, ПМН-4, ОЗМ-72, МОН-50. Заходи безпеки при поводженні.",
      type: "Theory",
      instructorTips: ["ПМН-2: не знешкоджується", "ОЗМ-72: радіус суцільного ураження 25м", "МОН-50: кут розльоту 54 градуси"],
      questions: [{question: "Час переведення ПМН-2 у бойове положення?", answer: "2-10 хвилин (залежить від температури)"}]
    },
    {
      time: "09:45 - 13:00",
      subject: "Встановлення мінних полів",
      description: "Практичне відпрацювання встановлення протипіхотних та протитанкових мінних полів вручну. Маскування.",
      type: "Practice",
      instructorTips: ["Витрата на маскування - 3-5 хв на міну", "Фіксація формуляру"],
      questions: [{question: "Крок мінування для ТМ-62?", answer: "4-5.5 метрів"}]
    },
    {
        time: "14:00 - 16:00",
        subject: "Інженерна розвідка та розмінування",
        description: "Дії сапера у складі групи розгородження. Робота з щупом та металошукачем. Пророблення проходів.",
        type: "Practice",
        instructorTips: ["Кут входження щупа 30-45 градусів", "Перевірка щупом кожні 2-3 см"],
        questions: [{question: "Довжина ручки щупа (стоячи)?", answer: "1.5 - 1.8 м"}]
    }
  ],
  "Tactics": [
    {
      time: "08:00 - 10:00",
      subject: "Маскування та протидія БПЛА",
      description: "Особливості маскування позицій від тепловізійних дронів. Використання рельєфу та 'зеленки'.",
      type: "Theory",
      instructorTips: ["Антитеплові пончо - ефективність 70%", "Заборона дивитись вгору відкритим обличчям"],
      questions: [{question: "Головна демаскуюча ознака вночі?", answer: "Світло, рух, теплова сигнатура"}]
    },
    {
      time: "10:15 - 13:00",
      subject: "Фортифікаційне обладнання позицій",
      description: "Влаштування окопів для стрільби лежачи/з коліна. Перекриті щілини. 'Лисячі нори'.",
      type: "Practice",
      instructorTips: ["Норматив на окоп лежачи - 20-30 хв", "Бруствер має бути непомітним"],
      questions: [{question: "Товщина перекриття для захисту від 82мм?", answer: "Мін. 60-80 см грунту + колоди"}]
    },
     {
        time: "14:00 - 16:00",
        subject: "Тактичне пересування (двійки/трійки)",
        description: "Відпрацювання взаємодії в маліх групах. Вогневе прикриття. Подолання небезпечних ділянок.",
        type: "Drill",
        instructorTips: ["Дистанція 6-8 метрів", "Голосовий контроль 'Тримаю!', 'Іду!'"],
        questions: [{question: "Дії при контакті спереду?", answer: "Впасти, відкрити вогонь, доповідь, маневр"}]
    }
  ],
  "Medicine": [
    {
      time: "08:00 - 10:00",
      subject: "Алгоритм MARCH. Масивні кровотечі",
      description: "Огляд зон критичної кровотечі. Самодопомога турнікетом (обидві руки, лежачи/стоячи).",
      type: "Practice",
      instructorTips: ["Час накладання - до 40 сек", "Перевірка пульсу обов'язкова"],
      questions: [{question: "Куди накладати турнікет в червоній зоні?", answer: "Максимально високо на кінцівку"}]
    },
    {
        time: "10:15 - 12:00",
        subject: "Прохідність дихальних шляхів та Тампонада",
        description: "Відновлення прохідності. Назофарингеальна трубка. Тампонування вузлових кровотеч (шия, пах, пахви).",
        type: "Practice",
        instructorTips: ["Тампонувати до упору кістки", "Тримати тиск мінімум 3 хв"],
        questions: [{question: "Протипоказання для назофарингеальної трубки?", answer: "Травма лицьової частини черепа"}]
    },
    {
        time: "14:00 - 16:00",
        subject: "Евакуація пораненого",
        description: "Способи відтягування з під вогню. Використання стропи та м'яких нош.",
        type: "Drill",
        instructorTips: ["Низький профіль силуету", "Зброя завжди напоготові"],
        questions: [{question: "Пріоритет в червоній зоні?", answer: "Вогнева перевага, потім допомога"}]
    }
  ]
};

const generateFallbackPlan = (data: TrainingFormData, reason: string = ""): TrainingPlanResponse => {
  const days: TrainingDay[] = [];
  
  const themesCycle = ["Engineering", "Tactics", "Engineering", "Medicine"];
  const titlesCycle = ["Інженерна підготовка", "Тактика та БПЛА", "Інженерна підготовка", "Тактична медицина"];

  for (let i = 1; i <= data.durationDays; i++) {
    const cycleIndex = (i - 1) % themesCycle.length;
    const themeKey = themesCycle[cycleIndex];
    const themeTitle = titlesCycle[cycleIndex];

    days.push({
      dayNumber: i,
      theme: themeTitle,
      objectives: ["Відпрацювання нормативів", "Закріплення теоретичних знань на практиці"],
      safetyNotes: "Робота з ММГ. Дотримання заходів безпеки при поводженні зі зброєю та імітаційними засобами.",
      schedule: FALLBACK_DB[themeKey]
    });
  }

  return {
    title: `План підготовки (${data.durationDays} дн.) - Шаблон`,
    overview: `⚠️ УВАГА: ${reason || "Відсутній зв'язок з ШІ"}. Сформовано стандартний план згідно з бойовими статутами. План покриває базові потреби підготовки для рівня "${data.experienceLevel}".`,
    days: days,
    isOffline: true
  };
};

// ==========================================
// 3. ЛОГІКА ГЕНЕРАЦІЇ (MAIN)
// ==========================================

export const generateTrainingPlan = async (data: TrainingFormData): Promise<TrainingPlanResponse> => {
  const userKey = localStorage.getItem("user_gemini_api_key");
  // Пріоритет: користувацький ключ -> env ключ -> пустий рядок
  const apiKey = (userKey && userKey.trim().length > 0) ? userKey : (process.env.API_KEY || "");

  // Якщо ключа взагалі немає - одразу шаблон
  if (!apiKey || apiKey.trim() === "") {
    console.log("No API key provided. Using fallback.");
    await new Promise(r => setTimeout(r, 800)); // Імітація роботи
    return generateFallbackPlan(data, "Ключ API не знайдено");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Role: Senior Military Instructor.
    Task: Create a training plan JSON for ${data.durationDays} days.
    Audience: ${data.experienceLevel}.
    Topics: ${JSON.stringify(data.focusAreas)}.
    Notes: "${data.customNotes}".

    Requirements: Ukrainian language. Military terminology. Realism.
    JSON Schema:
    {
      "title": "String",
      "overview": "String",
      "days": [
        {
          "dayNumber": Integer,
          "theme": "String",
          "objectives": ["String"],
          "safetyNotes": "String",
          "schedule": [
            {
              "time": "String",
              "subject": "String",
              "description": "String",
              "type": "Theory" | "Practice" | "Drill",
              "instructorTips": ["String"],
              "questions": [{"question": "String", "answer": "String"}]
            }
          ]
        }
      ]
    }
  `;

  let lastError = null;

  // Пробуємо різні моделі
  for (const modelName of AVAILABLE_MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      
      const parsed = JSON.parse(text) as TrainingPlanResponse;
      if (!parsed.days || parsed.days.length === 0) throw new Error("Invalid JSON");

      return parsed;

    } catch (e: any) {
      console.warn(`Model ${modelName} failed:`, e.message);
      lastError = e;
      
      // Якщо помилка критична (блок ключа), немає сенсу пробувати інші моделі
      if (e.message.includes("leaked") || e.message.includes("key")) {
          break; 
      }
    }
  }

  // Якщо ми дійшли сюди - всі спроби AI провалилися.
  // ЗАМІСТЬ ПОМИЛКИ ПОВЕРТАЄМО ШАБЛОН!
  console.error("All AI models failed. Switching to fallback mode.");
  
  let reason = "Сервіс ШІ перевантажений (помилка 429/500)";
  if (lastError?.message?.includes("key")) reason = "Невірний або заблокований API ключ";
  else if (lastError?.message?.includes("429")) reason = "Вичерпано ліміт запитів (Quota Exceeded)";

  return generateFallbackPlan(data, reason);
};

export const validateApiKey = async (apiKey: string): Promise<void> => {
    // Валідація залишається суворою, щоб користувач знав, працює ключ чи ні
    const ai = new GoogleGenAI({ apiKey });
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let isSuccess = false;
    let lastError: any = null;

    for (const model of modelsToTry) {
        try {
            await ai.models.generateContent({ model, contents: 'ping' });
            isSuccess = true;
            break;
        } catch (e) {
            lastError = e;
        }
    }

    if (!isSuccess) {
        const msg = lastError?.message || "Error";
        if (msg.includes("429")) throw new Error("Ліміт запитів вичерпано (429)");
        if (msg.includes("key") || msg.includes("403")) throw new Error("Ключ недійсний");
        throw new Error("Не вдалося перевірити ключ");
    }
};