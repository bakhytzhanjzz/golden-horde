"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { STRINGS, type Lang, type Strings } from "./strings";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
};

const LangContext = createContext<LangContextValue>({
  lang: "kz",
  setLang: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "gh-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Kazakh; server + first client render agree, so no hydration
  // mismatch. A stored preference is applied in an effect afterward.
  const [lang, setLangState] = useState<Lang>("kz");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "kz") setLangState(stored);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage failures (private mode, etc.) */
    }
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "kz" ? "en" : "kz";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}

/** Returns the UI string table for the current language. */
export function useStrings(): Strings {
  return STRINGS[useContext(LangContext).lang];
}
