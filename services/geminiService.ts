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

// Статичний план для Fallback режиму (коли немає квоти)
const FALLBACK_PLAN: TrainingPlanResponse = {
  title: "⚠️ РЕЗЕРВНИЙ ПЛАН (OFFLINE MODE)",
  overview: "Увага! Сервери Google зараз перевантажені (помилка 429). Щоб ви могли протестувати додаток, завантажено цей демонстраційний план. Він містить реальні протоколи, але не налаштований під ваш запит.",
  days: [
    {
      dayNumber: 1,
      theme: "Мінна безпека та основи БПЛА",
      objectives: ["Вивчення ПМН/ОЗМ", "Захист від скидів"],
      safetyNotes: "Робота виключно з ММГ (макетами). Дотримання дистанцій.",
      schedule: [
        {
          time: "08:00 - 10:00",
          subject: "Інженерні боєприпаси армії РФ",
          description: "ТТХ та принцип дії основних протипіхотних мін (ПМН-2, ПМН-4, ПОМ-3).",
          type: "Theory",
          instructorTips: [
            "ПМН-4: датчик цілі не знімається",
            "ПОМ-3: сейсмічний датчик, не підходити ближче 15м",
            "ОЗМ-72: радіус суцільного ураження 25м"
          ],
          questions: [
            { question: "Час самоліквідації ПОМ-3?", answer: "8 або 24 години" },
            { question: "Зусилля спрацювання ПМН-4?", answer: "0.2 - 5 кг (дуже чутлива)" },
            { question: "Радіус ураження ПМН-2?", answer: "Відрив стопи (локально)" }
          ]
        },
        {
          time: "10:15 - 13:00",
          subject: "Практика: Пошук та маркування",
          description: "Відпрацювання проходу 'змійкою' з щупом. Маркування виявлених ВНП.",
          type: "Practice",
          instructorTips: [
            "Кут входження щупа - 30-45 градусів",
            "Крок пошуку - не більше 5 см",
            "Маркування: добре видно своїм, не видно ворогу"
          ],
          questions: [
            { question: "Глибина перевірки щупом?", answer: "10-15 см" },
            { question: "Що робити, якщо щуп вперся у тверде?", answer: "Стоп. Оглянути. Не тиснути." },
            { question: "Ширина проходу для групи?", answer: "Не менше 0.5 - 1 метра" }
          ]
        },
        {
          time: "14:00 - 16:00",
          subject: "Протидія БПЛА (Мавік/FPV)",
          description: "Дії групи при виявленні дрона. Маскування позиції.",
          type: "Drill",
          instructorTips: [
            "Мавік зависає перед скидом",
            "FPV летить по прямій в ціль",
            "Не дивитись вгору відкритим обличчям"
          ],
          questions: [
            { question: "Основна ознака підготовки до скиду?", answer: "Дрон зупинився і завис" },
            { question: "Дії при звуці FPV?", answer: "Ривок в сторону/укриття, падіння" },
            { question: "Чи стріляти по дрону зі стрілецької?", answer: "Тільки якщо він атакує вас. Інакше - демаскування." }
          ]
        }
      ]
    },
    {
      dayNumber: 2,
      theme: "Тактична медицина та евакуація",
      objectives: ["Самодопомога", "Евакуація без нош"],
      safetyNotes: "Працювати в рукавицях. Імітація крові.",
      schedule: [
         {
          time: "08:00 - 10:00",
          subject: "Алгоритм MARCH (M)",
          description: "Масивні кровотечі. Накладання турнікету собі (одною рукою) та побратиму.",
          type: "Practice",
          instructorTips: [
            "Час накладання - до 30 сек",
            "Перевірка пульсу після затягування",
            "Напис часу на турнікеті"
          ],
          questions: [
            { question: "Де накладати турнікет в червоній зоні?", answer: "Максимально високо на кінцівку" },
            { question: "Критерій правильного накладання?", answer: "Відсутність пульсу на периферії" },
            { question: "Що робити після накладання?", answer: "В укриття / до зброї" }
          ]
        },
        {
          time: "10:15 - 13:00",
          subject: "Евакуація під вогнем",
          description: "Використання строп, волокуш, евакуація 'під пахви'.",
          type: "Drill",
          instructorTips: [
            "Голова пораненого в сторону руху",
            "Зброя пораненого залишається з ним",
            "Синхронізація дій групи евакуації"
          ],
          questions: [
            { question: "Найбезпечніший спосіб транспортування?", answer: "Повзком (волокуші)" },
            { question: "Хто прикриває евакуацію?", answer: "Вільні стрільці / кулеметник" },
            { question: "Як кріпити карабін стропи?", answer: "За евакуаційну петлю бронежилета" }
          ]
        }
      ]
    }
  ]
};

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

  const prompt = `
    РОЛЬ: Інструктор саперної роти ЗСУ.
    ЗАВДАННЯ: Розклад занять на ${data.durationDays} дн.
    РІВЕНЬ: ${data.experienceLevel}.
    ТЕМИ:
    ${selectedFocusDetails}
    НОТАТКИ: ${data.customNotes || "База."}

    ВИМОГИ:
    1. Структура: День -> Тема -> Розклад.
    2. Конкретика: В "instructorTips" пиши ТТХ і поради. Без води.
    3. Тест: Додай "questions" (РІВНО 3 питання) до кожного заняття.

    МОВА: Українська (військова).
  `;

  const MODELS_TO_TRY = [
    'gemini-1.5-flash-8b',  // Найлегша модель, найменший шанс 429
    'gemini-1.5-flash'      // Стандартна
  ];

  const generateWithRetry = async (attempt = 0): Promise<string> => {
    // Якщо спроби вичерпано, кидаємо помилку, яку спіймає зовнішній catch і поверне FALLBACK_PLAN
    if (attempt >= MODELS_TO_TRY.length + 1) {
        throw new Error("All retries failed");
    }

    const modelName = MODELS_TO_TRY[attempt % MODELS_TO_TRY.length];
    
    try {
      console.log(`Generating plan... Model: ${modelName} (Attempt ${attempt + 1})`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: "Ти досвідчений сапер. Пиши JSON.",
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
                            description: "ТТХ або поради"
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
                            description: "3 питання"
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
      console.warn(`Error with ${modelName}:`, err.toString());
      
      // Швидка пауза перед наступною спробою
      await wait(2000);
      return generateWithRetry(attempt + 1);
    }
  };

  try {
    const jsonText = await generateWithRetry();
    return JSON.parse(jsonText) as TrainingPlanResponse;

  } catch (error: any) {
    console.error("Gemini API Error (Using Fallback):", error);
    // ПОВЕРТАЄМО РЕЗЕРВНИЙ ПЛАН ЗАМІСТЬ ПОМИЛКИ
    return FALLBACK_PLAN;
  }
};