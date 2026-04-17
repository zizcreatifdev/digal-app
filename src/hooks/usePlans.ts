import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  slug: string;
  nom: string;
  prix_mensuel: number;
  prix_semestriel: number | null;
  promo_active: boolean;
  promo_label: string | null;
  promo_prix_mensuel: number | null;
  features: string[];
  ordre: number;
  actif: boolean;
  highlighted: boolean;
  badge: string | null;
  cta_text: string;
  max_membres: number | null;
}

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("actif", true)
        .order("ordre");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features as string[] : JSON.parse(typeof p.features === "string" ? p.features : "[]") as string[],
      }));
    },
    staleTime: 60_000,
  });
}

export function useAllPlans() {
  return useQuery<Plan[]>({
    queryKey: ["all-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("ordre");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features as string[] : JSON.parse(typeof p.features === "string" ? p.features : "[]") as string[],
      }));
    },
    staleTime: 30_000,
  });
}
