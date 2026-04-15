import type React from "react";
import { supabase } from "@/integrations/supabase/client";

export type PeriodType = "shooting" | "montage" | "livraison" | "custom";

export interface ProductionPeriod {
  id: string;
  user_id: string;
  client_id: string;
  type: PeriodType;
  titre: string;
  color: string | null;
  description: string | null;
  date_debut: string;
  date_fin: string;
  assigne_a: string | null;
  created_at: string;
  updated_at: string;
}

export const PERIOD_TYPES: { id: PeriodType; label: string; color: string; bg: string }[] = [
  { id: "shooting",  label: "🔵 Shooting photo/vidéo",   color: "text-blue-700",   bg: "bg-blue-100 border-blue-200" },
  { id: "montage",   label: "🟠 Montage / post-prod",     color: "text-orange-700", bg: "bg-orange-100 border-orange-200" },
  { id: "livraison", label: "🟢 Livraison de contenu",    color: "text-green-700",  bg: "bg-green-100 border-green-200" },
  { id: "custom",    label: "🟣 Personnalisé",             color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
];

export function getPeriodStyle(type: PeriodType) {
  return PERIOD_TYPES.find(p => p.id === type) ?? PERIOD_TYPES[3];
}

/** Returns an inline style object for custom periods with a free color. */
export function getPeriodInlineStyle(period: ProductionPeriod): React.CSSProperties | undefined {
  if (period.type === "custom" && period.color) {
    return {
      backgroundColor: period.color + "33", // 20% opacity
      borderColor: period.color + "66",
      color: period.color,
    };
  }
  return undefined;
}

export async function fetchProductionPeriods(clientId: string): Promise<ProductionPeriod[]> {
  const { data, error } = await supabase
    .from("production_periods")
    .select("*")
    .eq("client_id", clientId)
    .order("date_debut");
  if (error) throw error;
  return data as ProductionPeriod[];
}

export async function createProductionPeriod(
  period: Omit<ProductionPeriod, "id" | "created_at" | "updated_at">
): Promise<ProductionPeriod> {
  const { data, error } = await supabase
    .from("production_periods")
    .insert(period)
    .select()
    .single();
  if (error) throw error;
  return data as ProductionPeriod;
}

export async function updateProductionPeriod(
  id: string,
  updates: Partial<Omit<ProductionPeriod, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<void> {
  const { error } = await supabase
    .from("production_periods")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProductionPeriod(id: string): Promise<void> {
  const { error } = await supabase.from("production_periods").delete().eq("id", id);
  if (error) throw error;
}
