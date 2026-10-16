"use client";

// Design Ref: §3.3 ④ — 센터 담당자가 설문 링크 주소를 복사해 수강생에게 전달한다.
import { useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("아래 주소를 복사해 주세요.", `${window.location.origin}${path}`);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="h-9 rounded-lg border border-line px-3 text-sm font-medium transition hover:bg-line/60"
    >
      {copied ? "복사됨" : "주소 복사"}
    </button>
  );
}
