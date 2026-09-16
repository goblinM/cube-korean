"use client";

import { useEffect, useState } from "react";
import { LEARNING_STORAGE_UNAVAILABLE_EVENT } from "../features/progress/resilient-storage";

/** 本机存储不可用时说明数据边界，避免用户误以为进度已经持久保存。 */
export function StorageUnavailableNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showNotice = () => setVisible(true);
    window.addEventListener(LEARNING_STORAGE_UNAVAILABLE_EVENT, showNotice);
    return () => window.removeEventListener(LEARNING_STORAGE_UNAVAILABLE_EVENT, showNotice);
  }, []);

  if (!visible) return null;

  return (
    <aside className="storage-unavailable-notice" role="status">
      <div><strong>当前无法保存学习进度</strong><p>本次练习仍可继续，但刷新页面后进度可能丢失。请允许浏览器保存站点数据后再试。</p></div>
      <button type="button" onClick={() => setVisible(false)} aria-label="关闭存储提示">×</button>
    </aside>
  );
}
