import type { BrandCategory } from "@/types";

export interface CategoryMeta {
  label: string;
  value: BrandCategory;
  desc: string;
  stage: string;
  example: string;
}

/**
 * Collapsed to 5 plain categories -- see the BrandCategory comment in
 * src/types/brand.ts for why this is safe to consolidate.
 */
export const CATEGORIES: CategoryMeta[] = [
  {
    label: "Positioning",
    value: "POSITIONING",
    desc: "Who you are, your identity, differentiators, proof points, and brand persona.",
    stage: "Strategist & Writer",
    example: "Deterministic schema validation and sub-second multi-agent orchestration set us apart.",
  },
  {
    label: "Topics",
    value: "TOPICS",
    desc: "Core subject pillars and domain topics the AI is authorized to harvest and write about.",
    stage: "Harvester Agent",
    example: "Multi-Agent Orchestration, ERP Migrations, Voice AI Latency.",
  },
  {
    label: "Audience",
    value: "AUDIENCE",
    desc: "Who you're reaching -- target buyer personas and reader profiles.",
    stage: "Harvester & Strategist",
    example: "Lane A: Senior Backend Engineers. Lane B: VPs of Operations.",
  },
  {
    label: "Voice",
    value: "VOICE",
    desc: "How you sound: editorial philosophy, sentence rhythm, style rules, and CTAs.",
    stage: "Writer & Editor",
    example: "1-3 sentence paragraph cadence, grounded engineering observations, no corporate jargon.",
  },
  {
    label: "Forbidden & Banned",
    value: "FORBIDDEN",
    desc: "Strictly blacklisted words and buzzwords scanned and blocked by code.",
    stage: "Deterministic Gate",
    example: "'Dogma', 'Undeniable truth', 'Revolutionary', 'Seamless', 'DM me for template'.",
  },
];

