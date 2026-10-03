export type SocialTab = "LINKEDIN" | "FACEBOOK" | "TWITTER";
export type VariantField = "linkedin" | "facebook" | "twitter";

export interface SocialChannel {
  tab: SocialTab;
  field: VariantField;
  label: string;
  /** Classes for the selected tab button. */
  tabActiveClass: string;
  /** Classes for the Copy button. */
  copyClass: string;
  placeholder: string;
  emptyMessage: string;
  textareaMinHeight: number;
  /** The channel's own character limit, shown as a running count. */
  charLimit?: number;
}

export const SOCIAL_CHANNELS: SocialChannel[] = [
  {
    tab: "LINKEDIN",
    field: "linkedin",
    label: "LinkedIn",
    tabActiveClass: "bg-[#0077B5] border-[#005A88] text-white shadow-md shadow-[#0077B5]/20",
    copyClass: "bg-[#0077B5]/20 hover:bg-[#0077B5]/30 text-[#0077B5] border-[#0077B5]/40",
    placeholder: "Draft or polish your LinkedIn post copy here...",
    emptyMessage: "No LinkedIn variant was generated for this draft yet.",
    textareaMinHeight: 160,
  },
  {
    tab: "FACEBOOK",
    field: "facebook",
    label: "Facebook",
    tabActiveClass: "bg-[#1877F2] border-[#0F58B8] text-white shadow-md shadow-[#1877F2]/20",
    copyClass: "bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] border-[#1877F2]/40",
    placeholder: "Draft or polish your Facebook post copy here...",
    emptyMessage: "No Facebook variant was generated for this draft yet.",
    textareaMinHeight: 160,
  },
  {
    tab: "TWITTER",
    field: "twitter",
    label: "X",
    tabActiveClass: "bg-[#1DA1F2] border-[#1378B5] text-white shadow-md shadow-[#1DA1F2]/20",
    copyClass: "bg-white/10 hover:bg-white/20 text-white border-white/30",
    placeholder: "Draft or polish your X / Twitter thread or post...",
    emptyMessage: "No X variant was generated for this draft yet.",
    textareaMinHeight: 140,
    charLimit: 280,
  },
];

export const channelFor = (tab: SocialTab): SocialChannel => SOCIAL_CHANNELS.find((channel) => channel.tab === tab)!;
