"use client";

import { useEffect } from "react";
import Link from "next/link";

/** 为未捕获的页面错误提供可恢复出口，避免试用用户停留在空白页。 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("CubeKorean page error", error);
  }, [error]);

  return (
    <main className="error-page">
      <section className="error-card">
        <span aria-hidden="true">ㅋ</span>
        <small>RECOVERY</small>
        <h1>页面暂时没有加载成功</h1>
        <p>未提交的当前输入可能无法恢复，已完成的学习记录仍保存在这台设备上。</p>
        <div><button type="button" onClick={reset}>重新加载页面</button><Link href="/">返回课程首页</Link></div>
        {error.digest && <code>错误编号：{error.digest}</code>}
      </section>
    </main>
  );
}
