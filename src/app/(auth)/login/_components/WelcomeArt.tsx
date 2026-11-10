/**
 * Someone climbing a staircase of posts toward the sun: one post a week, one
 * step at a time. Line art in ink with one blue accent.
 */
export function WelcomeArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" className={className} role="img" aria-label="A person climbing a staircase of posts toward the sun">
      <circle cx="380" cy="86" r="48" className="fill-brand" />
      <g className="fill-surface stroke-ink" strokeWidth="2" strokeLinejoin="round">
        <rect x="40" y="282" width="120" height="56" rx="8" />
        <rect x="130" y="232" width="120" height="56" rx="8" />
        <rect x="220" y="182" width="120" height="56" rx="8" />
        <rect x="310" y="132" width="120" height="56" rx="8" />
      </g>
      <g className="stroke-ink" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M54 300h50M54 314h80M54 326h36" />
        <path d="M144 250h50M144 264h80M144 276h36" />
        <path d="M324 150h50M324 164h80M324 176h36" />
        <circle cx="282" cy="118" r="12" />
        <path d="M281 130 L276 160" />
        <path d="M276 160 L262 182" />
        <path d="M276 160 L292 168 L296 182" />
        <path d="M279 140 L262 152" />
        <path d="M279 140 L298 132 L310 120" />
        <path d="M20 338h440" strokeWidth="1.5" />
        <path d="M440 70l10-6M446 96h12M436 122l10 6" className="stroke-brand" />
      </g>
    </svg>
  );
}
