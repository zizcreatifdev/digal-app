import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Tag, PartyPopper, Shield, Users, Palette } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─────────────────────────────────────────────── */

interface PlanConfig {
  plan_type: string;
  duree_mois: number;
  prix_fcfa: number;
  est_actif: boolean;
  est_populaire: boolean;
}

/* ─── Constants ─────────────────────────────────────────── */

// Maps plans.slug → plan_configs.plan_type
const SLUG_TO_PLAN_TYPE: Record<string, string> = {
  solo_standard: "solo",
  agence_standard: "agence_standard",
  agence_pro: "agence_pro",
};

// Display name overrides (DB role values unchanged)
const PLAN_DISPLAY_NAMES: Record<string, string> = {
  freemium: "Découverte",
  solo_standard: "CM Pro",
  agence_standard: "Studio",
  agence_pro: "Elite",
};

const PLAN_TAGLINES: Record<string, string> = {
  freemium: "Commencez gratuitement, sans engagement",
  solo_standard: "Pour le Community Manager sérieux",
  agence_standard: "Votre équipe et vous, dans un seul endroit",
  agence_pro: "Pour les agences qui visent le sommet",
};

const AGENCE_FEATURE_MAP: Record<string, string> = {
  "1 DM + 3 membres": "1 DM + Community Managers + Créateurs (graphistes/vidéastes)",
  "1 DM + 7 membres": "1 DM + jusqu'à 6 membres (CM + Créateurs)",
};

const AGENCE_ROLES = [
  { icon: Shield, label: "Digital Manager", desc: "pilote les clients et la stratégie" },
  { icon: Users, label: "Community Manager", desc: "gère le calendrier et les validations" },
  { icon: Palette, label: "Créateur", desc: "graphiste ou vidéaste, dépose ses fichiers" },
] as const;

/* ─── Sub-components ─────────────────────────────────────── */

function AgenceRolesBlock({ highlighted }: { highlighted: boolean }) {
  return (
    <div className={`mt-5 mb-6 rounded-lg p-3 space-y-2 ${highlighted ? "bg-white/10" : "bg-primary/5 border border-primary/10"}`}>
      <p className={`text-[11px] font-semibold font-sans uppercase tracking-wider mb-2 ${highlighted ? "text-background/60" : "text-primary"}`}>
        Les 3 rôles inclus
      </p>
      {AGENCE_ROLES.map(({ icon: Icon, label, desc }) => (
        <div key={label} className="flex items-start gap-2">
          <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${highlighted ? "text-background/70" : "text-primary"}`} />
          <span className={`text-xs font-sans leading-snug ${highlighted ? "text-background/80" : "text-foreground/80"}`}>
            <span className="font-semibold">{label}</span>
            {" · "}
            <span className={highlighted ? "text-background/60" : "text-muted-foreground"}>{desc}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */

export function PricingSection() {
  const navigate = useNavigate();
  const { data: plans, isLoading } = usePlans();
  const [selectedDuree, setSelectedDuree] = useState(6);

  // Load plan_configs (public read, no auth needed)
  const { data: planConfigs } = useQuery({
    queryKey: ["plan-configs-public"],
    queryFn: async () => {
      // plan_configs not yet in generated types — cast required
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("plan_configs")
        .select("plan_type, duree_mois, prix_fcfa, est_actif, est_populaire")
        .eq("est_actif", true)
        .order("duree_mois");
      if (error) throw error;
      return (data ?? []) as PlanConfig[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Unique active durations across all plan types, filtered to Mensuel / 6 mois / Annuel
  const allDurations = [...new Set((planConfigs ?? []).map((c) => c.duree_mois))].sort((a, b) => a - b);
  const SHOWN_DURATIONS = [1, 6, 12];
  const durations = allDurations.filter((d) => SHOWN_DURATIONS.includes(d));

  // Get configured price for a plan at the selected duration
  const getConfigPrice = (slug: string, duree: number): number | null => {
    const planType = SLUG_TO_PLAN_TYPE[slug ?? ""];
    if (!planType) return null;
    const config = (planConfigs ?? []).find((c) => c.plan_type === planType && c.duree_mois === duree);
    return config?.prix_fcfa ?? null;
  };

  // Monthly base price for a plan
  const getMonthlyPrice = (slug: string): number | null => {
    const planType = SLUG_TO_PLAN_TYPE[slug ?? ""];
    if (!planType) return null;
    const monthly = (planConfigs ?? []).find((c) => c.plan_type === planType && c.duree_mois === 1);
    return monthly?.prix_fcfa ?? null;
  };

  // Discount % for toggle badge, using user-specified formula: raw% - 5
  const getToggleDiscountPct = (duree: number): number | null => {
    if (duree <= 1) return null;
    // Average across plans that have both monthly and target duration configs
    const planTypes = ["solo", "agence_standard", "agence_pro"];
    const percentages: number[] = [];
    for (const pt of planTypes) {
      const monthly = (planConfigs ?? []).find((c) => c.plan_type === pt && c.duree_mois === 1);
      const target = (planConfigs ?? []).find((c) => c.plan_type === pt && c.duree_mois === duree);
      if (!monthly || !target) continue;
      const raw = Math.round(((monthly.prix_fcfa * duree - target.prix_fcfa) / (monthly.prix_fcfa * duree)) * 100);
      percentages.push(raw - 5);
    }
    if (percentages.length === 0) return null;
    // All plans have the same effective %, use the first
    return percentages[0];
  };

  // Per-plan savings % for the savings badge below price
  const getSavingsPct = (slug: string, duree: number): number | null => {
    if (duree <= 1) return null;
    const planType = SLUG_TO_PLAN_TYPE[slug ?? ""];
    if (!planType) return null;
    const monthly = (planConfigs ?? []).find((c) => c.plan_type === planType && c.duree_mois === 1);
    const target = (planConfigs ?? []).find((c) => c.plan_type === planType && c.duree_mois === duree);
    if (!monthly || !target) return null;
    const raw = Math.round(((monthly.prix_fcfa * duree - target.prix_fcfa) / (monthly.prix_fcfa * duree)) * 100);
    return raw > 5 ? raw - 5 : null;
  };

  const durationLabel = (d: number) => {
    if (d === 1) return "Mensuel";
    if (d === 12) return "Annuel";
    return `${d} mois`;
  };

  const priceSuffix = (d: number) => {
    if (d === 1) return "/mois";
    if (d === 12) return "/an";
    return `/ ${d} mois`;
  };

  return (
    <section className="py-20 md:py-28 bg-card" id="tarifs">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Simple, transparent, FCFA
          </h2>
          <p className="text-muted-foreground font-sans text-lg max-w-xl mx-auto">
            Commencez gratuitement. Passez à la licence quand vous êtes prêt.
          </p>
        </div>

        {/* Duration toggle */}
        {durations.length > 1 && (
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-muted rounded-lg p-1 gap-1">
              {durations.map((d) => {
                const discountPct = getToggleDiscountPct(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDuree(d)}
                    className={`relative px-4 py-2 text-sm font-sans rounded-md transition-all ${
                      selectedDuree === d
                        ? "bg-background shadow text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {durationLabel(d)}
                    {discountPct !== null && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5">
                        -{discountPct}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans?.map((plan) => {
              const slug = plan.slug ?? "";
              const configPrice = getConfigPrice(slug, selectedDuree);
              const monthlyPrice = getMonthlyPrice(slug);
              const savingsPct = getSavingsPct(slug, selectedDuree);

              // Price to display: use plan_configs if available, else fallback to plans table
              const displayPrice = configPrice !== null
                ? configPrice
                : (plan.promo_active && plan.promo_prix_mensuel != null
                    ? plan.promo_prix_mensuel
                    : plan.prix_mensuel);

              const hasPromo = configPrice === null && plan.promo_active && plan.promo_prix_mensuel != null;

              // "au lieu de" full price for multi-month durations
              const auLieuDe = selectedDuree > 1 && configPrice !== null && monthlyPrice !== null
                ? monthlyPrice * selectedDuree
                : null;

              // Display name override
              const displayName = PLAN_DISPLAY_NAMES[slug] ?? plan.nom;
              const tagline = PLAN_TAGLINES[slug] ?? null;

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    plan.highlighted
                      ? "bg-foreground text-background border-foreground shadow-xl scale-[1.03] z-10"
                      : "border-border/50"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground border-0 text-[10px] px-3 py-0.5 whitespace-nowrap">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col flex-1">
                    <p className={`text-sm font-sans font-semibold mb-0.5 ${plan.highlighted ? "text-background/70" : "text-muted-foreground"}`}>
                      {displayName}
                    </p>
                    {tagline && (
                      <p className={`text-[11px] font-sans mb-3 leading-snug ${plan.highlighted ? "text-background/50" : "text-muted-foreground/70"}`}>
                        {tagline}
                      </p>
                    )}

                    <div className="mb-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-serif">
                        {displayPrice === 0 ? "Gratuit" : displayPrice.toLocaleString("fr-FR") + " FCFA"}
                      </span>
                      {displayPrice > 0 && (
                        <span className={`text-sm font-sans ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                          {priceSuffix(selectedDuree)}
                        </span>
                      )}
                    </div>

                    {/* "au lieu de" for multi-month */}
                    {auLieuDe !== null && auLieuDe !== displayPrice && (
                      <p className={`text-xs font-sans mb-1 line-through ${plan.highlighted ? "text-background/40" : "text-muted-foreground/60"}`}>
                        au lieu de {auLieuDe.toLocaleString("fr-FR")} FCFA
                      </p>
                    )}

                    {/* Savings badge */}
                    {savingsPct !== null && (
                      <div className="mb-1">
                        <Badge variant="secondary" className="gap-1 text-[10px] bg-emerald-100 text-emerald-700 border-0">
                          Économisez {savingsPct}%
                        </Badge>
                      </div>
                    )}

                    {/* Legacy promo badge (when no config price) */}
                    {hasPromo && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm line-through font-sans ${plan.highlighted ? "text-background/40" : "text-muted-foreground"}`}>
                          {plan.prix_mensuel.toLocaleString("fr-FR")} FCFA
                        </span>
                        <Badge variant="secondary" className="gap-1 text-[10px] bg-primary/10 text-primary border-0">
                          <Tag className="h-2.5 w-2.5" />
                          {plan.promo_label || "Promo"}
                        </Badge>
                      </div>
                    )}

                    <div className="mb-5" />

                    {(() => {
                      const isAgence = slug?.includes("agence") || plan.nom?.toLowerCase().includes("agence");
                      return (
                        <>
                          <ul className="space-y-2.5 mb-2 flex-1">
                            {plan.features.map((f) => {
                              const display = isAgence ? (AGENCE_FEATURE_MAP[f] ?? f) : f;
                              return (
                                <li key={f} className="flex items-start gap-2 text-sm font-sans">
                                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                                  <span className={plan.highlighted ? "text-background/80" : ""}>{display}</span>
                                </li>
                              );
                            })}
                          </ul>
                          {isAgence && <AgenceRolesBlock highlighted={plan.highlighted} />}
                        </>
                      );
                    })()}

                    <Button
                      variant={plan.highlighted ? "default" : "outline"}
                      className={`w-full gap-1.5 ${
                        plan.highlighted
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      }`}
                      onClick={() => navigate("/waitlist")}
                    >
                      {plan.cta_text}
                      {plan.cta_text.includes("liste") && <ArrowRight className="h-3.5 w-3.5" />}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {plans?.some(p => p.promo_active && p.promo_label) && (
          <p className="text-center mt-8 text-sm font-sans text-muted-foreground flex items-center justify-center gap-1.5">
            <PartyPopper className="h-4 w-4 text-primary" /> {plans.find(p => p.promo_active)?.promo_label}
          </p>
        )}
      </div>
    </section>
  );
}
