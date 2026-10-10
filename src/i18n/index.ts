import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import de from "./locales/de.json";

// Add a language: create locales/<code>.json and register it here.
export const resources = {
  en: { translation: en },
  de: { translation: de },
} as const;

export const SUPPORTED_LANGUAGES = Object.keys(resources);

i18n
  .use(LanguageDetector) // browser language until the user's profile locale loads
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true, // de-DE -> de
    load: "languageOnly",
    interpolation: { escapeValue: false }, // React already escapes
  });

// users.locale looks like "de-DE"; ignore values we have no translations for.
export function applyUserLocale(locale: string | null | undefined) {
  if (!locale) return;
  const lang = locale.split(/[-_]/)[0].toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(lang)) void i18n.changeLanguage(lang);
}

export default i18n;
