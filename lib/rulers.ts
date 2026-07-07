/**
 * Reigning rulers of the Ulus of Jochi / Golden Horde, used to put a human face
 * on every point of the timeline. Reigns are simplified to whole years and to
 * the principal ruler of each period — several ephemeral khans who held power
 * for only months (Sartaq, Ulaghchi, Tini Beg, and the many claimants of the
 * "Great Troubles") are folded into the adjacent major reign, since the slider
 * works at year granularity and cannot distinguish sub-year rule.
 *
 * Dates follow the conventional regnal years used by Halperin, Vásáry, and
 * Trepavlov; where sources disagree by a year we pick the commonly cited value.
 * Ranges are contiguous and non-overlapping so exactly one ruler matches a year.
 */

import type { Lang } from "./strings";

export type Reign = {
  id: string;
  name: { en: string; kz: string };
  /** Inclusive start year. */
  from: number;
  /** Inclusive end year. */
  to: number;
  /** One-line epithet / what this era is known for. */
  note: { en: string; kz: string };
  /** True for interregnum / fragmentation periods with no single stable khan. */
  interregnum?: boolean;
};

export const REIGNS: Reign[] = [
  {
    id: "jochi",
    name: { en: "Jochi", kz: "Жошы" },
    from: 1206,
    to: 1226,
    note: {
      en: "Eldest son of Genghis Khan; the western steppe becomes his ulus.",
      kz: "Шыңғыс ханның үлкен ұлы; батыс дала оның ұлысына айналады.",
    },
  },
  {
    id: "batu",
    name: { en: "Batu Khan", kz: "Бату хан" },
    from: 1227,
    to: 1256,
    note: {
      en: "Founder of the Golden Horde; his campaign reaches the gates of Europe.",
      kz: "Алтын Орданың негізін салушы; жорығы Еуропа қақпасына жетеді.",
    },
  },
  {
    id: "berke",
    name: { en: "Berke Khan", kz: "Берке хан" },
    from: 1257,
    to: 1266,
    note: {
      en: "First Muslim khan; wars with the Ilkhanate over the Caucasus.",
      kz: "Тұңғыш мұсылман хан; Кавказ үшін Ильханатпен соғысады.",
    },
  },
  {
    id: "mengu-timur",
    name: { en: "Möngke Temür", kz: "Меңгу-Темір" },
    from: 1267,
    to: 1280,
    note: {
      en: "Strikes the Horde's first coins and grants the Rus' church tax immunity.",
      kz: "Орданың алғашқы теңгелерін соғып, орыс шіркеуін салықтан босатады.",
    },
  },
  {
    id: "tode-mongke",
    name: { en: "Töde Möngke", kz: "Төде Меңгу" },
    from: 1281,
    to: 1290,
    note: {
      en: "A devout khan whose reign is dominated by the emir Nogai.",
      kz: "Билігі әмір Ноғайдың ықпалында болған діндар хан.",
    },
  },
  {
    id: "toqta",
    name: { en: "Toqta Khan", kz: "Тоқта хан" },
    from: 1291,
    to: 1312,
    note: {
      en: "Breaks the power of the overmighty emir Nogai and stabilises the realm.",
      kz: "Күшейіп кеткен әмір Ноғайды талқандап, елді тұрақтандырады.",
    },
  },
  {
    id: "ozbeg",
    name: { en: "Öz Beg Khan", kz: "Өзбек хан" },
    from: 1313,
    to: 1341,
    note: {
      en: "Makes Islam the state religion; the Horde reaches its political height.",
      kz: "Исламды мемлекеттік дінге айналдырады; Орда саяси шыңына жетеді.",
    },
  },
  {
    id: "janibeg",
    name: { en: "Jani Beg Khan", kz: "Жәнібек хан" },
    from: 1342,
    to: 1357,
    note: {
      en: "The empire's economic peak on the Volga trade; ends with his murder.",
      kz: "Еділ саудасындағы экономикалық шыңы; өлтірілуімен аяқталады.",
    },
  },
  {
    id: "berdibeg",
    name: { en: "Berdi Beg Khan", kz: "Бердібек хан" },
    from: 1358,
    to: 1359,
    note: {
      en: "His death without an heir opens two decades of civil war.",
      kz: "Мұрагерсіз қайтыс болуы жиырма жылдық азамат соғысын ашады.",
    },
  },
  {
    id: "great-troubles",
    name: { en: "The Great Troubles", kz: "Ұлы бүлік (Бұлғақ)" },
    from: 1360,
    to: 1379,
    interregnum: true,
    note: {
      en: "Over twenty khans in twenty years; the emir Mamai rules from the west.",
      kz: "Жиырма жылда жиырмадан астам хан; батыста әмір Мамай билейді.",
    },
  },
  {
    id: "toqtamysh",
    name: { en: "Toqtamysh Khan", kz: "Тоқтамыс хан" },
    from: 1380,
    to: 1395,
    note: {
      en: "Briefly reunites the Horde, then is shattered by Tamerlane (Timur).",
      kz: "Орданы қысқа уақытқа біріктіріп, кейін Әмір Темірден жеңіледі.",
    },
  },
  {
    id: "edigu",
    name: { en: "Edigü's Era", kz: "Едіге дәуірі" },
    from: 1396,
    to: 1419,
    interregnum: true,
    note: {
      en: "The emir Edigü rules through puppet khans as the realm frays.",
      kz: "Әмір Едіге қуыршақ хандар арқылы билейді, ел ыдырай бастайды.",
    },
  },
  {
    id: "ulugh-muhammad",
    name: { en: "Ulugh Muhammad", kz: "Ұлық Мұхаммед" },
    from: 1420,
    to: 1434,
    note: {
      en: "A contested khan who will later found the breakaway Khanate of Kazan.",
      kz: "Кейін бөлініп Қазан хандығын құратын, таласты билеуші хан.",
    },
  },
  {
    id: "kuchuk-muhammad",
    name: { en: "Küchük Muhammad", kz: "Кішік Мұхаммед" },
    from: 1435,
    to: 1459,
    note: {
      en: "Holds the core steppe together as Crimea and Kazan split away.",
      kz: "Қырым мен Қазан бөлінген тұста орталық даланы ұстап тұрады.",
    },
  },
  {
    id: "ahmad",
    name: { en: "Ahmad Khan", kz: "Ахмет хан" },
    from: 1460,
    to: 1481,
    note: {
      en: "Last strong khan; the 1480 Stand on the Ugra ends Rus' tribute.",
      kz: "Соңғы күшті хан; 1480 жылғы Угра тұрысы орыс алымын тоқтатады.",
    },
  },
  {
    id: "sheikh-ahmed",
    name: { en: "Sheikh Ahmed", kz: "Шейх Ахмет" },
    from: 1482,
    to: 1502,
    note: {
      en: "The last khan of the Great Horde, destroyed by Crimea in 1502.",
      kz: "1502 жылы Қырымнан жеңілген Ұлы Орданың соңғы ханы.",
    },
  },
];

/** The ruler reigning in `year`, or undefined if outside the covered range. */
export function rulerAt(year: number): Reign | undefined {
  return REIGNS.find((r) => year >= r.from && year <= r.to);
}

/** Localized ruler display name, falling back to English. */
export function rulerName(reign: Reign, lang: Lang): string {
  return lang === "kz" && reign.name.kz ? reign.name.kz : reign.name.en;
}

/** Localized one-line note for the reign, falling back to English. */
export function rulerNote(reign: Reign, lang: Lang): string {
  return lang === "kz" && reign.note.kz ? reign.note.kz : reign.note.en;
}
