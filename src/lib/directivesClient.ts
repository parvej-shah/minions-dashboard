import { apiClient } from "@/lib/api-client";
import type { BrandCategory, BrandDirectiveItem } from "@/types";

interface NewDirective {
  category: BrandCategory;
  key: string;
  content: string;
  priority?: number;
  from_onboarding?: boolean;
}

export const createDirective = ({ priority = 1, ...directive }: NewDirective) =>
  apiClient.post<BrandDirectiveItem>("/api/brand/directives", { ...directive, priority, audience_scope: "ALL" });

export const deleteDirectiveRequest = (id: string) => apiClient.delete(`/api/brand/directives/${id}`);
