"use client";

import { useEffect, useRef } from "react";

type CoffeeSupportDialogProps = { onClose: () => void };

const PAYMENT_CODES = [
  { name: "支付宝", image: "/support/alipay.jpg" },
  { name: "微信", image: "/support/wechat.jpg" },
];

export function CoffeeSupportDialog({ onClose }: CoffeeSupportDialogProps) {
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
      <button type="button" className="coffee-dialog-backdrop" onClick={onClose} aria-label="关闭支持面板" />
      <section ref={dialogRef} className="coffee-dialog" role="dialog" aria-modal="true" aria-labelledby="coffee-dialog-title" aria-describedby="coffee-dialog-description">
        <header>
          <span className="coffee-dialog-icon" aria-hidden="true">☕</span>
          <button ref={closeButtonRef} type="button" className="coffee-dialog-close" onClick={onClose} aria-label="关闭支持面板">×</button>
        </header>
        <h2 id="coffee-dialog-title">请 CubeKorean 喝杯咖啡</h2>
        <p id="coffee-dialog-description">如果韩语拼写练习对你有帮助，欢迎自愿支持。手机上可打开原图保存后识别；支付前请核对收款信息和金额。所有学习功能仍然免费。</p>
        <div className="coffee-payment-codes">
          {PAYMENT_CODES.map((method) => (
            <figure key={method.name}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 收款二维码使用原始静态图，避免图像优化影响扫码。 */}
              <img src={method.image} width="260" height="260" alt={`${method.name}收款二维码`} />
              <figcaption><strong>{method.name}扫一扫</strong><a href={method.image} target="_blank" rel="noopener noreferrer">打开原图 ↗</a></figcaption>
            </figure>
          ))}
        </div>
        <button type="button" className="coffee-dialog-done" onClick={onClose}>关闭，继续学习</button>
      </section>
    </div>
  );
}
