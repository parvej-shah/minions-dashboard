/** A tenant whose brand brief was never finished belongs in the wizard, but only from the home page. Staff viewing a tenant must see it as it is. */
export function shouldSendToBrief(input: {
  brandLoading: boolean;
  positioning: string | null | undefined;
  hasSettings: boolean;
  pathname: string;
  role: string | undefined;
}): boolean {
  if (input.role === "SYSTEM_ADMIN") return false;
  return !input.brandLoading && input.hasSettings && !input.positioning && input.pathname === "/";
}
