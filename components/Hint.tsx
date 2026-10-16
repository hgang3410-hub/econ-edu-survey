"use client";

// 낱말 옆의 작은 "?" 버튼. 눌러서(또는 키보드로) 쉬운 설명을 보여 준다. 마우스를 올릴 수 없는 휴대폰에서도 쓸 수 있다.
import { useId, useState } from "react";

export function Hint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="설명 보기"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-xs font-semibold text-muted transition hover:bg-line/60"
      >
        ?
      </button>
      {open && (
        <span id={id} role="tooltip" className="absolute left-0 top-7 z-20 w-60 rounded-xl border border-line bg-surface p-3 text-xs font-normal leading-5 text-foreground shadow-card">
          {text}
        </span>
      )}
    </span>
  );
}
