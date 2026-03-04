export type PublicLang = "de" | "en";

export const DEFAULT_PUBLIC_LANG: PublicLang = "de";

export const PUBLIC_LANG_COOKIE = "utrade_locale";

function firstValue(value: string | string[] | undefined | null): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.toLowerCase();
  }

  return value?.toLowerCase();
}

export function isPublicLang(value: string | undefined | null): value is PublicLang {
  return value === "de" || value === "en";
}

export function resolvePublicLanguage(
  queryLang: string | string[] | undefined,
  cookieLang?: string,
): PublicLang {
  const query = firstValue(queryLang);
  if (isPublicLang(query)) {
    return query;
  }

  const cookie = firstValue(cookieLang);
  if (isPublicLang(cookie)) {
    return cookie;
  }

  return DEFAULT_PUBLIC_LANG;
}

export function getNumberLocale(lang: PublicLang): string {
  return lang === "en" ? "en-US" : "de-DE";
}

type HeaderMessages = {
  appTitle: string;
  appSubtitle: string;
  logoAlt: string;
  languageLabel: string;
  german: string;
  english: string;
};

type DashboardMessages = {
  errorLoad: string;
  emptyTitle: string;
  emptyText: string;
  heroChip: string;
  heroTitle: string;
  heroText: string;
  kpiTotalProfit: string;
  kpiNftPool: string;
  kpiBronze: string;
  kpiSilver: string;
  kpiGold: string;
  kpiBurning: string;
  tokenUtt: string;
  tokenUshark: string;
  chartTitle: string;
  chartText: string;
  tierBronze: string;
  tierSilver: string;
  tierGold: string;
  nftTableTitle: string;
  burningTableTitle: string;
  columnMonth: string;
  columnNftPoolTotal: string;
  columnBronze: string;
  columnSilver: string;
  columnGold: string;
  columnBronzePerNft: string;
  columnSilverPerNft: string;
  columnGoldPerNft: string;
  columnUttAmount: string;
  columnUttLinks: string;
  columnUsharkAmount: string;
  columnUsharkLinks: string;
  open: string;
};

export const publicHeaderMessages: Record<PublicLang, HeaderMessages> = {
  de: {
    appTitle: "uTrade Finance Dashboard",
    appSubtitle: "Community Ansicht",
    logoAlt: "uTrade Finance Logo",
    languageLabel: "Sprache",
    german: "Deutsch",
    english: "Englisch",
  },
  en: {
    appTitle: "uTrade Finance Dashboard",
    appSubtitle: "Community View",
    logoAlt: "uTrade Finance Logo",
    languageLabel: "Language",
    german: "German",
    english: "English",
  },
};

export const dashboardMessages: Record<PublicLang, DashboardMessages> = {
  de: {
    errorLoad: "Community-Daten konnten nicht geladen werden.",
    emptyTitle: "Community Dashboard",
    emptyText: "Aktuell sind keine geschlossenen Monate für die Community freigegeben.",
    heroChip: "Community Freigabe",
    heroTitle: "uTrade Community Dashboard",
    heroText: "Veröffentlicht werden nur geschlossene Monate mit freigegebenen Werten.",
    kpiTotalProfit: "Gesamt Profit (alle veröffentlichten Monate)",
    kpiNftPool: "NFT Pool Gesamt",
    kpiBronze: "Profit Bronze Gesamt",
    kpiSilver: "Profit Silber Gesamt",
    kpiGold: "Profit Gold Gesamt",
    kpiBurning: "Gesamt Burning",
    tokenUtt: "UTT",
    tokenUshark: "USHARK",
    chartTitle: "Monatlicher NFT Pool (Chart)",
    chartText: "Pro Monat: Gesamtpool sowie Tier-Balken (Bronze, Silber, Gold).",
    tierBronze: "Bronze",
    tierSilver: "Silber",
    tierGold: "Gold",
    nftTableTitle: "Monatliche NFT-Pool-Aufteilung nach Tier",
    burningTableTitle: "Monatliche Burnings",
    columnMonth: "Monat",
    columnNftPoolTotal: "NFT Pool Gesamt",
    columnBronze: "Bronze",
    columnSilver: "Silber",
    columnGold: "Gold",
    columnBronzePerNft: "Bronze je NFT",
    columnSilverPerNft: "Silber je NFT",
    columnGoldPerNft: "Gold je NFT",
    columnUttAmount: "UTT Amount",
    columnUttLinks: "UTT Links",
    columnUsharkAmount: "USHARK Amount",
    columnUsharkLinks: "USHARK Links",
    open: "Open",
  },
  en: {
    errorLoad: "Community data could not be loaded.",
    emptyTitle: "Community Dashboard",
    emptyText: "No closed months are currently released for the community.",
    heroChip: "Community Release",
    heroTitle: "uTrade Community Dashboard",
    heroText: "Only closed months with approved values are published.",
    kpiTotalProfit: "Total Profit (all published months)",
    kpiNftPool: "NFT Pool Total",
    kpiBronze: "Total Bronze Profit",
    kpiSilver: "Total Silver Profit",
    kpiGold: "Total Gold Profit",
    kpiBurning: "Total Burning",
    tokenUtt: "UTT",
    tokenUshark: "USHARK",
    chartTitle: "Monthly NFT Pool (Chart)",
    chartText: "Per month: total pool and tier bars (Bronze, Silver, Gold).",
    tierBronze: "Bronze",
    tierSilver: "Silver",
    tierGold: "Gold",
    nftTableTitle: "Monthly NFT Pool Allocation by Tier",
    burningTableTitle: "Monthly Burnings",
    columnMonth: "Month",
    columnNftPoolTotal: "NFT Pool Total",
    columnBronze: "Bronze",
    columnSilver: "Silver",
    columnGold: "Gold",
    columnBronzePerNft: "Bronze per NFT",
    columnSilverPerNft: "Silver per NFT",
    columnGoldPerNft: "Gold per NFT",
    columnUttAmount: "UTT Amount",
    columnUttLinks: "UTT Links",
    columnUsharkAmount: "USHARK Amount",
    columnUsharkLinks: "USHARK Links",
    open: "Open",
  },
};
