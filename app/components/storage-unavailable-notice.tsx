"use client";

import { useEffect, useState } from "react";
import { LEARNING_STORAGE_UNAVAILABLE_EVENT } from "../features/progress/resilient-storage";
import { useI18n } from "../i18n/i18n-context";

/** 本机存储不可用时说明数据边界，避免用户误以为进度已经持久保存。 */
export function StorageUnavailableNotice() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showNotice = () => setVisible(true);
    window.addEventListener(LEARNING_STORAGE_UNAVAILABLE_EVENT, showNotice);
    return () => window.removeEventListener(LEARNING_STORAGE_UNAVAILABLE_EVENT, showNotice);
  }, []);

  if (!visible) return null;

  return (
    <aside className="storage-unavailable-notice" role="status">
      <div><strong>{t("storage.title")}</strong><p>{t("storage.description")}</p></div>
      <button type="button" onClick={() => setVisible(false)} aria-label={t("storage.close")}>×</button>
    </aside>
  );
}
