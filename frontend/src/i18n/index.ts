import { createContext, useContext, useState, useCallback, useMemo, createElement, type ReactNode } from "react";
import ko, { type TranslationKey } from "./translations/ko";
import en from "./translations/en";
import ja from "./translations/ja";
import zhTW from "./translations/zh-TW";

export type Lang = "ko" | "en" | "ja" | "zh-TW";

const STORAGE_KEY = "joody_lang";

const dictionaries: Record<Lang, Record<string, string>> = { ko, en, ja, "zh-TW": zhTW };

const localeMap: Record<Lang, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  "zh-TW": "zh-TW",
};

function getSavedLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && v in dictionaries) return v as Lang;
  } catch {
    // ignore
  }
  return "ko";
}

// ---------- Context ----------

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  locale: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ---------- Provider ----------

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getSavedLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let text = dictionaries[lang]?.[key] ?? dictionaries.ko[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.split(`{${k}}`).join(String(v));
        }
      }
      return text;
    },
    [lang],
  );

  const locale = localeMap[lang];

  const value = useMemo(() => ({ lang, setLang, t, locale }), [lang, setLang, t, locale]);

  return createElement(LanguageContext.Provider, { value }, children);
}

// ---------- Hooks ----------

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useT() {
  return useLanguage().t;
}

export function useLocale() {
  return useLanguage().locale;
}

// ---------- Static helper for class components (ErrorBoundary) ----------

export function getStaticT() {
  const lang = getSavedLang();
  const dict = dictionaries[lang] ?? dictionaries.ko;
  return (key: string, params?: Record<string, string | number>): string => {
    let text = dict[key] ?? dictionaries.ko[key as TranslationKey] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.split(`{${k}}`).join(String(v));
      }
    }
    return text;
  };
}

export type { TranslationKey };
