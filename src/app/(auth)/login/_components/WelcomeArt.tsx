/**
 * What Minions makes, drawn in code: a small stack of finished posts (a cover
 * poster and a written post) with the one promise on top, "approved by you".
 * Sits on a light editorial panel with a soft blue glow (the app has no dark islands). No people, no numbers.
 */
export function WelcomeArt({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="A stack of finished LinkedIn posts, each one approved by you"
      className={`relative isolate overflow-hidden rounded-[28px] bg-surface-2 ring-1 ring-inset ring-line/60 md:rounded-[32px] ${className}`}
    >
      {/* Light: one blue glow and a faint top sheen. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_70%_30%,rgba(0,102,204,0.16),transparent_70%),radial-gradient(50%_40%_at_15%_90%,rgba(0,102,204,0.08),transparent_70%)]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div aria-hidden="true" className="relative mx-auto flex h-full w-full max-w-[420px] items-center justify-center px-6 pb-6 pt-14 md:py-10">
        <div className="relative h-[170px] w-[220px] min-[400px]:h-[200px] min-[400px]:w-[250px] sm:h-[300px] sm:w-[320px] lg:scale-[1.3] xl:scale-[1.45]">
          {/* Back card: a written post. */}
          <div className="absolute left-0 top-6 w-[72%] -rotate-6 rounded-2xl border border-line bg-surface/90 p-4 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)] animate-[login-float_7s_ease-in-out_infinite]">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-surface-3" />
              <span className="h-2 w-16 rounded-full bg-line-strong" />
            </div>
            <div className="mt-4 space-y-2">
              <span className="block h-2 w-full rounded-full bg-surface-3" />
              <span className="block h-2 w-11/12 rounded-full bg-surface-3" />
              <span className="block h-2 w-3/5 rounded-full bg-surface-3" />
            </div>
          </div>

          {/* Front card: the cover poster. */}
          <div className="absolute bottom-0 right-0 w-[78%] rotate-3 overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-16px_rgba(0,40,90,0.35)] animate-[login-float_7s_ease-in-out_-3.5s_infinite]">
            <div className="bg-brand px-4 pb-6 pt-5 sm:px-5 sm:pb-8 sm:pt-6">
              <span className="block h-1.5 w-10 rounded-full bg-white/50" />
              <p className="mt-3 text-[19px] font-bold leading-[1.1] tracking-tight text-white sm:text-[23px]">
                What a week of real work taught me
              </p>
            </div>
            <div className="space-y-2 px-4 py-3 sm:px-5 sm:py-4">
              <span className="block h-2 w-full rounded-full bg-surface-3" />
              <span className="block h-2 w-2/3 rounded-full bg-surface-3" />
            </div>
          </div>

          {/* The promise. */}
          <div className="absolute -top-1 right-0 flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] sm:-top-3 sm:text-[14px]">
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-success" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M5.2 8.2l1.9 1.9 3.7-4" />
            </svg>
            Approved by you
          </div>
        </div>
      </div>
    </div>
  );
}
