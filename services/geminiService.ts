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
    const detail = TOPIC_DETAILS[topic] || "Тема важлива. Акцент на практиці.";
    return `ТЕМА: ${topic}. СУТЬ: ${detail}`;
  }).join("\n");

  // Оптимізований промпт для економії токенів
  const prompt = `
    РОЛЬ: Інструктор саперної роти ЗСУ.
    ЗАВДАННЯ: Розклад занять на ${data.durationDays} дн.
    РІВЕНЬ: ${data.experienceLevel}.
    ТЕМИ:
    ${selectedFocusDetails}
    НОТАТКИ: ${data.customNotes || "База."}

    ВИМОГИ:
    1. Структура: День -> Тема -> Розклад.
    2. Конкретика: В "instructorTips" пиши ТТХ (вага, радіус) та короткі поради. Без води.
    3. Тест: Додай масив "questions" (РІВНО 3 питання) до кожного заняття. Питання практичні. Відповідь коротка.

    МОВА: Українська (військова).
  `;

  // Пріоритет на стабільну модель 1.5-flash, яка має вищі ліміти для Free Tier
  const MODELS_TO_TRY = [
    'gemini-1.5-flash',      // Найстабільніша для Free Tier (15 RPM)
    'gemini-1.5-flash-8b',   // Дуже швидка і легка
    'gemini-2.0-flash-exp'   // Розумна, але часто перевантажена
  ];

  const generateWithRetry = async (attempt = 0): Promise<string> => {
    const modelName = MODELS_TO_TRY[attempt % MODELS_TO_TRY.length];
    
    try {
      console.log(`Generating plan... Model: ${modelName} (Attempt ${attempt + 1})`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          // Відключаємо пошук повністю, це головна причина 429
          systemInstruction: "Ти досвідчений сапер. Пиши коротко, чітко, по-військовому. Використовуй JSON.",
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
                            description: "3-4 пункти ТТХ або порад"
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
                            description: "Рівно 3 питання"
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
      if (!text) throw new Error("No text response");
      return text;

    } catch (err: any) {
      const errorMsg = err.toString().toLowerCase();
      console.warn(`Error with ${modelName}:`, errorMsg);

      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted");
      const isOverloaded = errorMsg.includes("503") || errorMsg.includes("overloaded");

      // Якщо помилка квоти, робимо довшу паузу
      if ((isQuotaError || isOverloaded) && attempt < 5) {
        // Збільшуємо час очікування: 4с, 8с, 12с...
        const delay = 4000 * (attempt + 1); 
        console.warn(`Quota hit. Waiting ${delay/1000}s before retry...`);
        await wait(delay);
        return generateWithRetry(attempt + 1);
      }
      
      throw err;
    }
  };

  try {
    const jsonText = await generateWithRetry();
    return JSON.parse(jsonText) as TrainingPlanResponse;

  } catch (error: any) {
    console.error("Gemini API Fatal Error:", error);
    
    const errorString = error.message || error.toString();
    
    if (errorString.includes("429") || errorString.includes("quota")) {
       throw new Error("⏳ Сервери Google перевантажені запитами (429). Спробуйте зменшити кількість днів у плані або зачекайте 5 хвилин.");
    }
    
    throw new Error("⚠️ Не вдалося згенерувати план. Спробуйте ще раз.");
  }
};