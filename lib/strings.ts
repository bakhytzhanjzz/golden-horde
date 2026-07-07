/**
 * UI string dictionary for the English/Kazakh language switch.
 * Data content (stories, quizzes, names) is localized separately in
 * lib/localize.ts; this file is only the app chrome.
 */

export type Lang = "kz" | "en";

export type Strings = {
  subtitle: string;
  browseAll: string;
  sites: string;
  routes: string;
  timeline: string;
  point: string;
  points: string;
  answered: string;
  siteType: Record<"city" | "capital" | "sacred" | "port" | "battle", string>;
  routeType: Record<"trade" | "military" | "postal", string>;
  keyDates: string;
  activePeriod: string;
  founded: string;
  fought: string;
  destroyed: string;
  peakPeriod: string;
  whoFought: string;
  attacker: string;
  defender: string;
  story: string;
  didYouKnow: string;
  activeFrom: string;
  activeUntil: string;
  routeSuffix: string;
  play: string;
  pause: string;
  replay: string;
  reign: string;
  modernBorders: string;
  quickQuiz: string;
  correct: string;
  notQuitePrefix: string;
  explore: string;
  exploreSub: string;
  searchPlaceholder: string;
  filterAll: string;
  filterPlaces: string;
  filterBattles: string;
  filterRoutes: string;
  nothingMatches: string;
  chatName: string;
  chatRole: string;
  chatWelcome: string;
  chatTryAsking: string;
  chatPlaceholder: string;
  chatDisclaimer: string;
  chatFooter: string;
  chatSuggested: string[];
};

export const STRINGS: Record<Lang, Strings> = {
  en: {
    subtitle: "Golden Horde: A Journey Through Time",
    browseAll: "Browse all",
    sites: "Sites",
    routes: "Routes",
    timeline: "Timeline",
    point: "point",
    points: "points",
    answered: "answered",
    siteType: {
      city: "City",
      capital: "Capital",
      sacred: "Sacred site",
      port: "Port / trading post",
      battle: "Battle site",
    },
    routeType: { trade: "Trade", military: "Military", postal: "Postal (yam)" },
    keyDates: "Key dates",
    activePeriod: "Active period",
    founded: "Founded",
    fought: "Fought",
    destroyed: "Destroyed / abandoned",
    peakPeriod: "Peak period",
    whoFought: "Who fought",
    attacker: "Attacker",
    defender: "Defender",
    story: "Story",
    didYouKnow: "Did you know?",
    activeFrom: "Active from",
    activeUntil: "Active until",
    routeSuffix: "route",
    play: "Play",
    pause: "Pause",
    replay: "Replay",
    reign: "Reign",
    modernBorders: "Modern borders",
    quickQuiz: "Quick quiz",
    correct: "Correct! +1 point",
    notQuitePrefix: "Not quite — the answer is",
    explore: "Explore the Horde",
    exploreSub: "Jump to any site, battle, or route",
    searchPlaceholder: "Search by name…",
    filterAll: "All",
    filterPlaces: "Places",
    filterBattles: "Battles",
    filterRoutes: "Routes",
    nothingMatches: "Nothing matches",
    chatName: "Bek — AI Historian",
    chatRole: "Golden Horde Heritage Guide",
    chatWelcome:
      "Salam! I'm **Bek**, your AI historian-guide to the Golden Horde. 🏺\n\nAsk me anything about the empire's cities, trade routes, khans, or legacy — I'm here to bring the history to life!",
    chatTryAsking: "Try asking:",
    chatPlaceholder: "Ask about the Golden Horde…",
    chatDisclaimer: "AI-generated — verify important facts.",
    chatFooter:
      "Powered by Gemini · Enter to send · Shift+Enter for newline · Esc to close",
    chatSuggested: [
      "Why did the Golden Horde fall apart?",
      "Tell me about Otrar and the Mongol invasion",
      "What was the Silk Road like under the Horde?",
      "Who was Batu Khan?",
    ],
  },
  kz: {
    subtitle: "Алтын Орда: уақыт арқылы саяхат",
    browseAll: "Барлығын қарау",
    sites: "Орындар",
    routes: "Жолдар",
    timeline: "Уақыт сызығы",
    point: "ұпай",
    points: "ұпай",
    answered: "жауап берілді",
    siteType: {
      city: "Қала",
      capital: "Астана",
      sacred: "Қасиетті орын",
      port: "Айлақ / сауда бекеті",
      battle: "Шайқас орны",
    },
    routeType: { trade: "Сауда", military: "Әскери", postal: "Пошта (жам)" },
    keyDates: "Негізгі даталар",
    activePeriod: "Белсенді кезең",
    founded: "Негізі қаланған",
    fought: "Шайқас жылы",
    destroyed: "Қирады / тасталды",
    peakPeriod: "Гүлдену кезеңі",
    whoFought: "Кім соғысты",
    attacker: "Шабуылдаушы",
    defender: "Қорғаушы",
    story: "Тарихы",
    didYouKnow: "Білесіз бе?",
    activeFrom: "Басталуы",
    activeUntil: "Аяқталуы",
    routeSuffix: "жолы",
    play: "Ойнату",
    pause: "Кідірту",
    replay: "Қайталау",
    reign: "Билігі",
    modernBorders: "Қазіргі шекаралар",
    quickQuiz: "Шағын сынақ",
    correct: "Дұрыс! +1 ұпай",
    notQuitePrefix: "Дұрыс емес — дұрыс жауабы:",
    explore: "Орданы зертте",
    exploreSub: "Кез келген орынға, шайқасқа немесе жолға өтіңіз",
    searchPlaceholder: "Атауы бойынша іздеу…",
    filterAll: "Барлығы",
    filterPlaces: "Орындар",
    filterBattles: "Шайқастар",
    filterRoutes: "Жолдар",
    nothingMatches: "Ештеңе табылмады",
    chatName: "Бек — ЖИ тарихшы",
    chatRole: "Алтын Орда мұрасының гиды",
    chatWelcome:
      "Сәлем! Мен **Бек**, Алтын Орда бойынша ЖИ тарихшы-гидыңызбын. 🏺\n\nИмперияның қалалары, сауда жолдары, хандары немесе мұрасы туралы кез келген нәрсені сұраңыз — тарихты бірге тірілтейік!",
    chatTryAsking: "Мынаны сұрап көріңіз:",
    chatPlaceholder: "Алтын Орда туралы сұраңыз…",
    chatDisclaimer: "ЖИ жауаптары — маңызды деректерді тексеріңіз.",
    chatFooter:
      "Gemini арқылы · Enter — жіберу · Shift+Enter — жаңа жол · Esc — жабу",
    chatSuggested: [
      "Алтын Орда неге ыдырады?",
      "Отырар мен моңғол шапқыншылығы туралы айтыңыз",
      "Орда тұсындағы Жібек жолы қандай болды?",
      "Бату хан кім болған?",
    ],
  },
};
