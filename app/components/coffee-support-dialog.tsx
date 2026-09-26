"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "../i18n/i18n-context";

type CoffeeSupportDialogProps = { onClose: () => void };

const PAYMENT_CODES = [
  { nameKey: "coffee.alipay" as const, image: "/support/alipay.jpg" },
  { nameKey: "coffee.wechat" as const, image: "/support/wechat.jpg" },
];

export function CoffeeSupportDialog({ onClose }: CoffeeSupportDialogProps) {
  const { t } = useI18n();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const buttons = Array.from(dialogRef.current.querySelectorAll<HTMLButtonElement>("button"));
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="coffee-dialog-layer">
      <button type="button" className="coffee-dialog-backdrop" onClick={onClose} aria-label={t("coffee.close")} />
      <section ref={dialogRef} className="coffee-dialog" role="dialog" aria-modal="true" aria-labelledby="coffee-dialog-title" aria-describedby="coffee-dialog-description">
        <header>
          <span className="coffee-dialog-icon" aria-hidden="true">☕</span>
          <button ref={closeButtonRef} type="button" className="coffee-dialog-close" onClick={onClose} aria-label={t("coffee.close")}>×</button>
        </header>
        <h2 id="coffee-dialog-title">{t("coffee.title")}</h2>
        <p id="coffee-dialog-description">{t("coffee.description")}</p>
        <div className="coffee-payment-codes">
          {PAYMENT_CODES.map((method) => {
            const methodName = t(method.nameKey);
            return (
            <figure key={method.nameKey}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 收款二维码使用原始静态图，避免图像优化影响扫码。 */}
              <img src={method.image} width="260" height="260" alt={t("coffee.qrAlt", { method: methodName })} />
              <figcaption><strong>{t("coffee.scan", { method: methodName })}</strong><a href={method.image} target="_blank" rel="noopener noreferrer">{t("coffee.original")}</a></figcaption>
            </figure>
          );})}
        </div>
        <button type="button" className="coffee-dialog-done" onClick={onClose}>{t("coffee.done")}</button>
      </section>
    </div>
  );
}
