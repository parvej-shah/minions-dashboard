/** Full-screen layout for the onboarding wizard: no sidebar, no dashboard nav. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-canvas text-ink">{children}</div>;
}
