/** Full-screen layout for unauthenticated routes: no sidebar, no dashboard nav. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
