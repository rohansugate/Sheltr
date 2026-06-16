import type { Locale } from "./types";

const en = {
  tagline: "Tinder for Section 8 housing",
  vsCompetitor: "Faster than GoSection8 — swipe, match, apply",
  discover: "Discover",
  matches: "Matches",
  profile: "Profile",
  savedMatches: "Saved Matches",
  swipeRight: "Swipe right to save · left to pass",
  tutorialTitle: "How Sheltr works",
  tutorialBody: "Swipe right to save homes you like. Swipe left to pass. Tap Undo if you change your mind.",
  tutorialDismiss: "Got it",
  pass: "Pass",
  save: "Save",
  undo: "Undo",
  apply: "Apply",
  scheduleShowing: "Schedule Showing",
  viewDetails: "View Details",
  noMatches: "No saved matches yet",
  goDiscover: "Go to Discover",
  map: "Map",
  list: "List",
  compare: "Compare",
  filters: "Filters",
  maxRent: "Max rent",
  groundFloorOnly: "Ground floor only",
  anyNeighborhood: "Any neighborhood",
  whyMatch: "Why this match",
  language: "Language",
  darkMode: "Dark mode",
  accessibility: "Accessibility",
  largeText: "Large text",
  highContrast: "High contrast",
  reduceMotion: "Reduce motion",
  switchRole: "Switch role",
  notifications: "Notifications",
  landlordVerified: "Verified Landlord",
  section8: "Section 8 Approved",
  applications: "Applications",
  analytics: "Analytics",
  views: "Views",
  saves: "Saves",
  accept: "Accept",
  decline: "Decline",
  contactMethod: "Preferred contact",
  phone: "Phone",
  email: "Email",
  voucherCaseNumber: "Voucher / case number",
  applyAfterShowing: "Apply after your showing is accepted",
  showingPending: "Showing requested — awaiting landlord",
  showingAccepted: "Showing confirmed!",
  addToCalendar: "Add to calendar",
  showingConfirmedMsg: "Your showing is confirmed. You can apply after you visit.",
  landlordMessage: "Message to seeker (optional)",
  compareSelect: "Select up to 3 to compare",
  compareSelectOneMore: "Select one more listing to compare side by side.",
  compareBestPick: "Best overall match",
  compareMonthlyRent: "Monthly rent",
  compareRentPerBed: "Rent / bedroom",
  compareBedrooms: "Bedrooms",
  compareBathrooms: "Bathrooms",
  compareNeighborhood: "Neighborhood",
  compareZip: "Zip code",
  compareDistance: "Distance from you",
  compareSection8: "Section 8",
  compareGroundFloor: "Ground floor",
  compareLandlord: "Landlord",
  compareTransit: "Transit & nearby",
  compareProximity: "Your priorities nearby",
  compareFitsVoucher: "Fits your voucher",
  compareYourStatus: "Your status",
  comparePets: "Pets allowed",
  compareUtilities: "Utilities",
  compareAvailable: "Available",
  compareLowest: "lowest",
  compareRemove: "Remove",
  compareNotApplied: "Not applied",
  compareYes: "Yes",
  compareNo: "No",
  compareApproved: "Approved",
  compareVerified: "Verified",
  compareUnverified: "Unverified",
  compareMiles: "mi",
  editPreferences: "Edit Preferences",
  savePreferences: "Save Preferences",
  applyFailed: "Complete a showing before applying to this home.",
  applicationSent: "Application sent to landlord.",
  searchingListings: "Searching Section 8 & Zillow near you…",
  section8Near: "Homes near",
  loadingHomes: "Loading homes…",
  listingSearchFailed: "Could not load listings for your zip.",
  retry: "Retry",
  zillowSetupHint: "Zillow search not connected — add Bright Data key for more rentals",
  sourceSection8: "{count} Section 8 homes from Affordable Housing",
  sourceZillow: "{count} from Zillow",
  hideFilters: "Hide filters",
  zillowListing: "From Zillow — ask landlord about Section 8",
  updatedJustNow: "Updated just now",
  updatedOneMinAgo: "Updated 1 min ago",
  updatedMinAgo: "Updated {mins} min ago",
  coverageLimited:
    "Sheltr has the deepest coverage in Los Angeles County. Showing the closest matches we found.",
  coverageMetro:
    "Few homes in {zip} — expanded to nearby LA neighborhoods that fit your voucher.",
  coverageFallback:
    "No live listings for {zip} yet. Browse voucher-friendly homes in the LA area below.",
} as const;

export type TranslationKey = keyof typeof en;

const es: Partial<Record<TranslationKey, string>> = {
  tagline: "Tinder para vivienda Sección 8",
  discover: "Descubrir", matches: "Coincidencias", profile: "Perfil",
  savedMatches: "Guardados", swipeRight: "Desliza derecha para guardar",
  tutorialTitle: "Cómo funciona Sheltr",
  tutorialBody: "Desliza a la derecha para guardar. Izquierda para pasar. Deshacer si cambias de opinión.",
  tutorialDismiss: "Entendido", pass: "Pasar", save: "Guardar", undo: "Deshacer",
  apply: "Aplicar", scheduleShowing: "Agendar visita", viewDetails: "Ver detalles",
  map: "Mapa", list: "Lista", compare: "Comparar", filters: "Filtros",
  applications: "Solicitudes", accept: "Aceptar", decline: "Rechazar",
  showingAccepted: "¡Visita confirmada!", addToCalendar: "Agregar al calendario",
  compareSelect: "Selecciona hasta 3 para comparar",
  editPreferences: "Editar preferencias",
  applyFailed: "Completa una visita antes de aplicar.",
};

const zh: Partial<Record<TranslationKey, string>> = {
  tagline: "第八条款住房版 Tinder", discover: "发现", matches: "匹配", profile: "个人",
  tutorialTitle: "如何使用 Sheltr", tutorialDismiss: "知道了", pass: "跳过", save: "保存", undo: "撤销",
};

const tl: Partial<Record<TranslationKey, string>> = {
  tagline: "Tinder para sa Section 8 housing", discover: "Tuklasin", matches: "Mga match",
  tutorialTitle: "Paano gumagana ang Sheltr", tutorialDismiss: "Sige",
};

const vi: Partial<Record<TranslationKey, string>> = {
  tagline: "Tinder cho nhà ở Mục 8", discover: "Khám phá", matches: "Đã lưu",
  tutorialTitle: "Cách dùng Sheltr", tutorialDismiss: "Đã hiểu",
};

const ja: Partial<Record<TranslationKey, string>> = {
  tagline: "セクション8住宅版Tinder", discover: "探す", matches: "保存済み",
  tutorialTitle: "Sheltrの使い方", tutorialDismiss: "OK",
};

const hi: Partial<Record<TranslationKey, string>> = {
  tagline: "सेक्शन 8 आवास के लिए Tinder", discover: "खोजें", matches: "सहेजे गए",
  tutorialTitle: "Sheltr कैसे काम करता है", tutorialDismiss: "समझ गया",
};

const ar: Partial<Record<TranslationKey, string>> = {
  tagline: "تيندر لسكن القسم 8", discover: "اكتشف", matches: "المحفوظات",
  tutorialTitle: "كيف يعمل Sheltr", tutorialDismiss: "فهمت",
};

const fr: Partial<Record<TranslationKey, string>> = {
  tagline: "Tinder pour le logement Section 8", discover: "Découvrir", matches: "Favoris",
  tutorialTitle: "Comment utiliser Sheltr", tutorialDismiss: "Compris",
};

const locales: Record<Locale, Partial<Record<TranslationKey, string>>> = {
  en, es, zh, tl, vi, ja, hi, ar, fr,
};

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English", es: "Español", zh: "中文", tl: "Tagalog", vi: "Tiếng Việt",
  ja: "日本語", hi: "हिन्दी", ar: "العربية", fr: "Français",
};

export function t(locale: Locale, key: TranslationKey): string {
  return locales[locale]?.[key] ?? en[key];
}
