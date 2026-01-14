import { GoogleGenAI, Type } from "@google/genai";
import { TrainingFormData, TrainingPlanResponse } from "../types";

// Жорсткий, реалістичний опис тем для умов повномасштабної війни
const TOPIC_DETAILS: Record<string, string> = {
  // --- Інженерно-саперна справа ---
  "Фортифікація: Бліндажі та 'Лисячі нори'": "Правила трьох накатів. Гідроізоляція підручними засобами. Як швидко заритися, коли над головою висить дрон. Обладнання перекритих щілин.",
  "Інженерні загородження (МЗП/Дріт)": "Встановлення МЗП (Малопомітна Перешкода/путанка). Спіраль Бруно. Експрес-загородження. Як не заплутатися самому під час відходу.",
  "ВНП РФ та Мінна безпека (ПМН/ОЗМ)": "ПМН-4, ПОМ-3 'Медальйон', ОЗМ-72. Пастки МЛ-7/МЛ-8. Правило: 'Не знаєш - не чіпай'.",
  "Дистанційне мінування (Земледелие/ПФМ)": "Як виглядають касети КПТМ. 'Пелюстки' (ПФМ-1) в траві. ПОМ-2 'Отек'. Звук відстрілу касет. Дії групи при потраплянні під дистанційне мінування.",
  "Пророблення проходів (Тропи)": "Створення піших проходів. Робота з щупом та кішкою. Маркування 'стежки життя' для піхоти, яке не світиться для ворога.",
  "Підривна справа (Розрахунок зарядів)": "В'язання запальних трубок (ЗТП). Розрахунок тротилу. Електричний спосіб підривання. ТБ при підриві.",

  // --- Медицина ---
  "Самодопомога в червоній зоні": "Турнікет собі одною рукою лежачи. Контроль кровотечі. Дії, коли медик не може підійти.",
  "Робота з пораненням під обстрілом": "Перев'язка брудними руками. Тампонада. Знебол. Евакуація без нош.",
  "Переміщення пораненого (волокуші/стропи)": "Евакуація волокушами повзком. Робота стропою з укриття. 'Ривок' тіла в безпечну зону.",

  // --- Тактика / Виживання ---
  "Маскування від 'Тепла' (Mavic 3T)": "Як працює тепловізор. Антитеплові накидки. Використання рельєфу. Чому не можна дивитися вгору відкритим обличчям.",
  "Окопування лежачи (під вогнем)": "Швидке риття одиночного окопу лежачи. Маскування свіжої землі. Захист від осколків.",
  "Антидронові перекриття (Бліндажі)": "Сітки-рабиці, 'мангали'. Захист входу в бліндаж. L-подібні входи.",
  "Нічна робота (ПНБ/Тепловізори)": "Рух вночі. Світломаскування рацій. Робота 'двійками' в темряві.",

  // --- БПЛА (Реалії) ---
  "Захист від скидів (Мавік/Аутел)": "Тактика 'зависання' дрона. Характерний звук перед скидом. Чому не можна бігти по прямій. Використання стовбурів дерев як захисту.",
  "Дії при атаці FPV (Маневр/Укриття)": "Звук наближення (вищання). Різкий маневр в останній момент. Падіння обличчям в землю (захист ніг та паху). РЕБ 'рюкзак' (якщо є).",
  "Робота під 'Пташкою' (Коригування по рації)": "Взаємодія з пілотом. Сліпа довіра командам: 'Стій', 'Лівіше', 'Чисто'. Пілот бачить міни на поверхні краще за тебе.",
  "Акустичне виявлення (На слух)": "Як на слух відрізнити: Мавік (дзижчить), FPV (вищить як болгарка), Крило (гуде як мопед). Визначення напрямку та відстані.",

  // --- Зв'язок ---
  "Радіодисципліна та шифрування": "Короткі команди. Таблиця позивних. Чому ворог слухає 'Баофенги'.",
  "Прошивка та аварійне скидання": "Як стерти рацію при загрозі полону."
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateTrainingPlan = async (data: TrainingFormData): Promise<TrainingPlanResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const selectedFocusDetails = data.focusAreas.map(topic => {
    const detail = TOPIC_DETAILS[topic] || "Тема важлива для виживання. Акцент на практиці.";
    return `ТЕМА: ${topic}. \nСУТЬ: ${detail}`;
  }).join("\n    ");

  // Оптимізований промпт без вимоги пошуку (економить квоту)
  const prompt = `
    ТИ: Досвідчений головний сержант інженерно-саперної роти ЗСУ. 
    ЗАВДАННЯ: Скласти розклад занять.
    
    Вхідні дані:
    - Днів: ${data.durationDays}.
    - Рівень: ${data.experienceLevel}.
    - ОБРАНІ ТЕМИ:
    ${selectedFocusDetails}
    - Коментар: ${data.customNotes || "Зроби з них людей."}

    КРИТИЧНІ ВИМОГИ:
    1. МОНОЛІТНІ ДНІ: Групуй заняття за змістом.
    2. ІНФОРМАЦІЯ:
       - У розділі "instructorTips" пиши конкретні ТТХ, поради та методики зі своєї бази знань.
       - НЕ ПИШИ загальних фраз ("розкажіть про міни"). ПИШИ конкретику ("ПМН-2: датчик цілі 5-25 кг").
    3. КОНТРОЛЬ ЗНАНЬ:
       - 5 "підлих" питань до кожного заняття.
       - Питання мають бути практичними.

    Мова: Українська (військова).
  `;

  // Список моделей для перебору у випадку помилки
  const MODELS_TO_TRY = [
    'gemini-2.0-flash-exp',          // Дуже швидка, експериментальна
    'gemini-2.0-flash-thinking-exp', // Розумніша, але може бути повільнішою
    'gemini-1.5-pro'                 // Якщо флеш недоступний, пробуємо про (іноді квоти різні)
  ];

  const generateWithRetry = async (attempt = 0): Promise<string> => {
    const modelName = MODELS_TO_TRY[attempt % MODELS_TO_TRY.length];
    
    try {
      console.log(`Attempting with model: ${modelName} (Try ${attempt + 1})`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          // ВИМКНЕНО googleSearch для економії квоти (найчастіша причина 429)
          // tools: [{googleSearch: {}}], 
          systemInstruction: "Ти бойовий інструктор. Використовуй свої внутрішні знання про ТТХ озброєння та тактику. Не використовуй пошук, якщо не впевнений.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              overview: { type: Type.STRING },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER },
                    theme: { type: Type.STRING },
                    objectives: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    safetyNotes: { type: Type.STRING },
                    schedule: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          time: { type: Type.STRING },
                          subject: { type: Type.STRING },
                          description: { type: Type.STRING },
                          instructorTips: { 
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Концентрат знань (ТТХ, дистанції, вага)."
                          },
                          questions: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                question: { type: Type.STRING },
                                answer: { type: Type.STRING }
                              },
                              required: ["question", "answer"]
                            },
                            description: "Список з 5 контрольних питань."
                          },
                          type: { 
                            type: Type.STRING, 
                            enum: ["Theory", "Practice", "Drill"]
                          }
                        },
                        required: ["time", "subject", "description", "instructorTips", "type", "questions"]
                      }
                    }
                  },
                  required: ["dayNumber", "theme", "objectives", "safetyNotes", "schedule"]
                }
              }
            },
            required: ["title", "overview", "days"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No text response from AI");
      return text;

    } catch (err: any) {
      const errorMsg = err.toString().toLowerCase();
      console.warn(`Error with ${modelName}:`, errorMsg);

      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted");
      const isOverloaded = errorMsg.includes("503") || errorMsg.includes("overloaded");

      // Якщо помилка квоти або перевантаження, і ми ще не перебрали всі варіанти
      if ((isQuotaError || isOverloaded) && attempt < 4) {
        const delay = 2000 * Math.pow(1.5, attempt); // 2s, 3s, 4.5s...
        console.warn(`Retrying in ${delay}ms...`);
        await wait(delay);
        // Пробуємо наступну модель або ту саму ще раз
        return generateWithRetry(attempt + 1);
      }
      
      throw err;
    }
  };

  try {
    const jsonText = await generateWithRetry();
    return JSON.parse(jsonText) as TrainingPlanResponse;

  } catch (error: any) {
    console.error("Gemini API Error Full Object:", error);
    
    const errorString = error.message || error.toString();
    
    if (errorString.includes("429") || errorString.includes("quota")) {
       throw new Error("⏳ Квота вичерпана. Спробуйте через 2-3 хвилини (це обмеження Google).");
    }
    
    throw new Error("⚠️ Не вдалося згенерувати план. Спробуйте ще раз.");
  }
};