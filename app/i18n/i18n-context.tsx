"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, zhCN, type MessageKey } from "./messages";
import type { UiLocale } from "./types";

export type { UiLocale } from "./types";
type Variables = Record<string, string | number>;

const dictionaries = { "zh-CN": zhCN, en };

export function translateMessage(locale: UiLocale, key: MessageKey, variables: Variables = {}): string {
  return dictionaries[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(variables[name] ?? `{${name}}`));
}

type I18nValue = {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  t: (key: MessageKey, variables?: Variables) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

/** 在不影响学习状态的前提下提供中英文界面文案，并同步页面语言与元数据。 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<UiLocale>("zh-CN");
  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t: (key, variables) => translateMessage(locale, key, variables) }), [locale]);

  useEffect(() => {
    const routeLocale = localeFromPath(window.location.pathname);
    if (!routeLocale) return;
    const timer = window.setTimeout(() => setLocale(routeLocale), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === "en" ? "CubeKorean · Korean spelling for everyday life" : "CubeKorean · 韩语生活词汇听写";
    const description = locale === "en"
      ? "Practice practical Korean spelling through copy exercises, audio dictation and focused mistake review."
      : "通过看词拼写、听音默写和错词复习，掌握真实生活中的韩语词汇。";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.setAttribute("href", locale === "en" ? "/manifest-en.webmanifest" : "/manifest.webmanifest");
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function localeFromPath(pathname: string): UiLocale | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/zh" || pathname.startsWith("/zh/")) return "zh-CN";
  return null;
}

export function localePath(locale: UiLocale): string {
  return locale === "en" ? "/en" : "/zh";
}
