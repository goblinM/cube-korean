"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "./i18n/i18n-context";

/** 为未捕获的页面错误提供可恢复出口，避免试用用户停留在空白页。 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale, t } = useI18n();
  useEffect(() => {
    console.error("CubeKorean page error", error);
  }, [error]);

  return (
    <main className="error-page">
      <section className="error-card">
        <span aria-hidden="true">ㅋ</span>
        <small>RECOVERY</small>
        <h1>{t("error.title")}</h1>
        <p>{t("error.description")}</p>
        <div><button type="button" onClick={reset}>{t("error.reload")}</button><Link href={locale === "en" ? "/en" : "/zh"}>{t("error.home")}</Link></div>
        {error.digest && <code>{t("error.code", { code: error.digest })}</code>}
      </section>
    </main>
  );
}
