"use client";

import { localePath, type UiLocale, useI18n } from "../i18n/i18n-context";

type LanguageSelectorProps = { disabled?: boolean; onChange?: (locale: UiLocale) => void };

/** 允许用户主动选择界面语言；不读取或推断IP、国家及设备语言。 */
export function LanguageSelector({ disabled = false, onChange }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="language-selector">
      <span aria-hidden="true">🌐</span>
      <span className="sr-only">{t("language.label")}</span>
      <select aria-label={t("language.label")} disabled={disabled} value={locale} onChange={(event) => {
        const next = event.target.value as UiLocale;
        setLocale(next);
        window.history.replaceState({}, "", localePath(next));
        onChange?.(next);
      }}>
        <option value="zh-CN">{t("language.chinese")}</option>
        <option value="en">{t("language.english")}</option>
      </select>
    </label>
  );
}
