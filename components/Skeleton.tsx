// 내용을 불러오는 동안 보여 주는 흐릿한 틀(스켈레톤). "불러오는 중…" 글자보다 덜 어색하다.
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-line ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="화면을 불러오는 중" className="flex min-h-full flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:pl-72">
      <Bar className="h-8 w-64" />
      <Bar className="h-5 w-96 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Bar key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Bar className="h-64 rounded-2xl" />
      <Bar className="h-72 rounded-2xl" />
      <span className="sr-only">불러오는 중…</span>
    </div>
  );
}

export function SurveySkeleton() {
  return (
    <div role="status" aria-label="설문을 불러오는 중" className="flex flex-col gap-5">
      <Bar className="h-9 w-72 max-w-full" />
      <Bar className="h-32 rounded-2xl" />
      <Bar className="h-2 rounded-full" />
      <Bar className="h-72 rounded-3xl" />
      <span className="sr-only">불러오는 중…</span>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div role="status" aria-label="불러오는 중" className="flex flex-col gap-3">
      <Bar className="h-6 w-40" />
      <Bar className="h-4 w-full" />
      <Bar className="h-4 w-2/3" />
      <span className="sr-only">불러오는 중…</span>
    </div>
  );
}
