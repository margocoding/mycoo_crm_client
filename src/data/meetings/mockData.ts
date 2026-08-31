export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
}

export interface TranscriptEntry {
  speakerId: string;
  time: string;
  text: string;
}

export interface SummarySection {
  items: string[];
}

export interface MeetingSummary {
  discussions: SummarySection;
  decisions: SummarySection;
  problems: SummarySection;
  nextSteps: SummarySection;
}

export interface Agreement {
  id: string;
  title: string;
  assigneeId: string;
  deadline: string;
  criteria: string;
  status: "pending" | "created";
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  participants: string[];
  emails: string[];
  agenda: string;
  status: "upcoming" | "processing" | "completed";
  platform: "zoom" | "meet" | "yandex";
  hasRecording: boolean;
  transcript?: TranscriptEntry[];
  summary?: MeetingSummary;
  agreements?: Agreement[];
}

export const teamMembers: TeamMember[] = [
  { id: "u1", name: "Иван Петров", role: "CEO / Основатель", email: "ivan@mycoo.ru", avatar: "ИП" },
  { id: "u2", name: "Мария Сидорова", role: "Финансовый директор", email: "maria@mycoo.ru", avatar: "МС" },
  { id: "u3", name: "Алексей Иванов", role: "CTO", email: "alex@mycoo.ru", avatar: "АИ" },
  { id: "u4", name: "Елена Козлова", role: "Руководитель отдела продаж", email: "elena@mycoo.ru", avatar: "ЕК" },
  { id: "u5", name: "Дмитрий Волков", role: "Маркетинг-директор", email: "dmitry@mycoo.ru", avatar: "ДВ" },
  { id: "u6", name: "Ольга Новикова", role: "HR-директор", email: "olga@mycoo.ru", avatar: "ОН" },
];

export const meetings: Meeting[] = [
  {
    id: "m1",
    title: "Планёрка по операциям",
    date: "2026-09-01",
    time: "10:00",
    duration: 60,
    participants: ["u1", "u2", "u3", "u4"],
    emails: ["ivan@mycoo.ru", "maria@mycoo.ru", "alex@mycoo.ru", "elena@mycoo.ru"],
    agenda: "1. Бюджет на Q4\n2. Нагрузка отдела продаж\n3. Найм технических специалистов\n4. Дорожная карта продукта",
    status: "completed",
    platform: "zoom",
    hasRecording: true,
    transcript: [
      { speakerId: "u1", time: "00:00:12", text: "Коллеги, доброе утро. Начнём с бюджета на следующий квартал." },
      { speakerId: "u2", time: "00:00:45", text: "Иван, я подготовила предварительные расчёты. Нам нужно заложить 18 миллионов на операционку." },
      { speakerId: "u1", time: "00:01:22", text: "Давай уточним: до пятницы подготовь финальный вариант, а Мария проверит его до понедельника." },
      { speakerId: "u2", time: "00:01:58", text: "Договорились. Иван до пятницы готовит новый бюджет, я до понедельника проверю его." },
      { speakerId: "u3", time: "00:03:14", text: "По технической части: нам нужны два backend-разработчика до конца месяца, иначе не успеем с релизом." },
      { speakerId: "u6", time: "00:04:01", text: "Я запускаю поиск на этой неделе. Нужно согласовать профиль кандидатов." },
      { speakerId: "u1", time: "00:04:38", text: "Хорошо, Алексей, до четверга составь техническое ТЗ для HR. Ольга, запускай воронку сразу после получения ТЗ." },
    ],
    summary: {
      discussions: {
        items: [
          "Формирование бюджета на Q4 — операционные расходы составят около 18 млн ₽",
          "Нехватка backend-разработчиков влияет на сроки релиза продукта",
          "Нагрузка отдела продаж требует перераспределения ресурсов",
          "Необходимо синхронизировать профиль кандидатов между технической командой и HR",
        ],
      },
      decisions: {
        items: [
          "Бюджет на Q4 утверждён в размере 18 млн ₽ на операционные нужды",
          "Открыты две вакансии backend-разработчиков с приоритетным наймом до конца месяца",
          "Профиль кандидата утверждается CTO до запуска рекрутинговой воронки",
        ],
      },
      problems: {
        items: [
          "Критическая нехватка backend-ресурсов перед релизом",
          "Риск срыва сроков по продукту без расширения команды",
        ],
      },
      nextSteps: {
        items: [
          "Подготовить финальный бюджет Q4 до пятницы",
          "Проверить и согласовать бюджет до понедельника",
          "Составить техническое ТЗ для найма разработчиков до четверга",
          "Запустить рекрутинговую воронку сразу после получения ТЗ",
        ],
      },
    },
    agreements: [
      {
        id: "a1",
        title: "Подготовить финальный бюджет на Q4",
        assigneeId: "u1",
        deadline: "2026-09-05",
        criteria: "Бюджет подготовлен, согласован с CFO и загружен в систему",
        status: "pending",
      },
      {
        id: "a2",
        title: "Проверить и утвердить бюджет Q4",
        assigneeId: "u2",
        deadline: "2026-09-08",
        criteria: "Бюджет проверен, замечания отправлены, финальная версия утверждена",
        status: "pending",
      },
      {
        id: "a3",
        title: "Составить техническое ТЗ для найма backend-разработчиков",
        assigneeId: "u3",
        deadline: "2026-09-04",
        criteria: "ТЗ с требованиями, стеком и задачами передано HR-отделу",
        status: "pending",
      },
      {
        id: "a4",
        title: "Запустить рекрутинговую воронку по двум вакансиям",
        assigneeId: "u6",
        deadline: "2026-09-05",
        criteria: "Вакансии опубликованы, воронка настроена, первые отклики получены",
        status: "pending",
      },
    ],
  },
  {
    id: "m2",
    title: "Продажи: план недели",
    date: "2026-09-03",
    time: "12:30",
    duration: 45,
    participants: ["u1", "u4", "u5"],
    emails: ["ivan@mycoo.ru", "elena@mycoo.ru", "dmitry@mycoo.ru"],
    agenda: "1. Выполнение плана за прошлую неделю\n2. Горячие лиды\n3. Совместная маркетинговая кампания",
    status: "completed",
    platform: "meet",
    hasRecording: true,
    transcript: [
      { speakerId: "u4", time: "00:00:23", text: "По итогам прошлой недели мы закрыли 12 сделок из 15 запланированных." },
      { speakerId: "u1", time: "00:01:05", text: "Это 80%. Елена, к пятнице подготовь разбор трёх сорванных сделок." },
      { speakerId: "u5", time: "00:02:11", text: "У меня есть идея по совместной кампании — запуск в конце месяца, нужен бюджет 500 тысяч." },
    ],
    summary: {
      discussions: {
        items: [
          "Итоги недели: 12 из 15 сделок закрыто (80% плана)",
          "Необходимо провести разбор сорванных сделок",
          "Инициатива по совместной маркетинговой кампании с бюджетом 500 тыс ₽",
        ],
      },
      decisions: {
        items: [
          "Провести разбор сорванных сделок до пятницы",
          "Рассмотреть идею маркетинговой кампании на следующей неделе",
        ],
      },
      problems: {
        items: [
          "20% сделок сорваны — требуется root cause анализ",
        ],
      },
      nextSteps: {
        items: [
          "Подготовить разбор трёх сорванных сделок",
          "Презентовать концепцию маркетинговой кампании",
        ],
      },
    },
    agreements: [
      {
        id: "a5",
        title: "Подготовить разбор трёх сорванных сделок",
        assigneeId: "u4",
        deadline: "2026-09-05",
        criteria: "Документ с анализом причин и планом корректирующих действий готов",
        status: "pending",
      },
      {
        id: "a6",
        title: "Презентовать концепцию маркетинговой кампании",
        assigneeId: "u5",
        deadline: "2026-09-09",
        criteria: "Презентация с бюджетом, каналами и ожидаемыми KPI готова",
        status: "pending",
      },
    ],
  },
  {
    id: "m3",
    title: "Финансовый срез",
    date: "2026-09-05",
    time: "15:00",
    duration: 90,
    participants: ["u1", "u2"],
    emails: ["ivan@mycoo.ru", "maria@mycoo.ru"],
    agenda: "1. Cash flow за август\n2. Прогноз на сентябрь\n3. Оптимизация расходов",
    status: "upcoming",
    platform: "yandex",
    hasRecording: false,
  },
  {
    id: "m4",
    title: "Продуктовая стратегия Q4",
    date: "2026-09-02",
    time: "14:00",
    duration: 120,
    participants: ["u1", "u3", "u4", "u5"],
    emails: ["ivan@mycoo.ru", "alex@mycoo.ru", "elena@mycoo.ru", "dmitry@mycoo.ru"],
    agenda: "Обсуждение продуктовой дорожной карты и приоритетов на Q4",
    status: "processing",
    platform: "zoom",
    hasRecording: true,
  },
];