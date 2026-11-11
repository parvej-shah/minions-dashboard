export interface AccountIdentityUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface AccountIdentityBrand {
  brand_name?: string | null;
  primary_logo_url?: string | null;
}

export interface ResolvedAccountIdentity {
  avatarUrl: string | null;
  displayName: string;
  initial: string;
}

/**
 * Resolves the display name and avatar photo for the account menu,
 * prioritizing brand settings over the Google OAuth session.
 */
export function resolveAccountIdentity(
  sessionUser: AccountIdentityUser | null | undefined,
  brandSettings: AccountIdentityBrand | null | undefined
): ResolvedAccountIdentity {
  const avatarUrl = brandSettings?.primary_logo_url?.trim() || sessionUser?.image || null;
  const displayName =
    brandSettings?.brand_name?.trim() || sessionUser?.name || sessionUser?.email || "Account";
  const initial = displayName[0]?.toUpperCase() ?? "A";

  return { avatarUrl, displayName, initial };
}
