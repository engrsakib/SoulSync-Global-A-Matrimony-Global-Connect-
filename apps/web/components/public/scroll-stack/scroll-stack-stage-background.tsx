/** Ambient glow behind the isometric stack column (server-safe). */
export function ScrollStackStageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute top-[46%] left-1/2 h-[min(420px,58vh)] w-[min(400px,88%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-brand-500)]/14 blur-3xl" />
      <div className="absolute top-[50%] left-[56%] h-44 w-44 -translate-x-1/2 rounded-full bg-[color-mix(in_oklch,var(--primary)_20%,transparent)] blur-3xl" />
      <div className="absolute bottom-[18%] left-1/2 h-16 w-[min(280px,70%)] -translate-x-1/2 rounded-[100%] bg-[var(--foreground)]/8 blur-2xl" />
    </div>
  );
}
