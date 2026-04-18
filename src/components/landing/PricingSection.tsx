import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Tag, PartyPopper, Shield, Users, Palette, Star, ChevronDown, ChevronUp } from "lucide-react";
import { usePlans, Plan } from "@/hooks/usePlans";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EliteContactModal } from "./EliteContactModal";

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

// Rename feature strings that reference old plan names
const FEATURE_RENAME_MAP: Record<string, string> = {
  "Tout Solo Standard inclus": "Tout CM Pro inclus",
  "Tout Solo Pro inclus": "Tout CM Pro inclus",
  "Tout Agence Standard inclus": "Tout Studio inclus",
  "Tout Agence Pro inclus": "Tout Elite inclus",
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

// Always show these 3 duration options in the toggle, regardless of DB state
const SHOWN_DURATIONS = [1, 6, 12];

// Fixed features for the Elite (agence_pro) card — replaces DB data
// "Membres" line is generated dynamically from plan.max_membres
const ELITE_FEATURES_BASE = [
  "Tout Studio inclus",
  "Support prioritaire dédié",
  "Onboarding personnalisé",
  "Formation équipe incluse",
  "Contrat sur mesure",
];

// Hardcoded fallback prices (FCFA) used when plan_configs has no entry
// for a given plan_type + duree_mois combination
const FALLBACK_PRICES: Record<string, Record<number, number>> = {
  solo:             { 1: 15000,  6: 75000,  12: 140000 },
  agence_standard:  { 1: 35000,  6: 175000, 12: 330000 },
  agence_pro:       { 1: 55000,  6: 275000, 12: 520000 },
};

/* ─── Helpers ───────────────────────────────────────────── */

function getMemberText(plan: Plan): string {
  const slug = plan.slug ?? "";
  const max = plan.max_membres;
  if (slug === "freemium") return "1 utilisateur uniquement";
  if (slug === "solo" || slug === "solo_standard") return "1 utilisateur (vous)";
  if (slug === "agence_pro") {
    return max == null ? "Membres illimités" : `1 DM + jusqu'à ${max - 1} membres (CM + Créateurs)`;
  }
  if (slug === "agence_standard") {
    return max != null ? `1 DM + jusqu'à ${max - 1} membres (CM + Créateurs)` : "1 DM + Community Managers + Créateurs";
  }
  return "";
}

/* ─── Sub-components ─────────────────────────────────────── */

function AgenceRolesAccordion({ highlighted, isElite }: { highlighted: boolean; isElite?: boolean }) {
  const [open, setOpen] = useState(false);
  const borderCls = isElite
    ? "border-[#E8511A]/30"
    : highlighted
    ? "border-background/20"
    : "border-[#E8511A]/20";

  return (
    <div className={`mt-4 mb-4 rounded-lg border overflow-hidden ${borderCls}`}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-semibold font-sans uppercase tracking-wider transition-colors"
        style={{ color: "#E8511A" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span>Les 3 rôles inclus</span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
      </button>
      <div
        className="transition-all duration-200 overflow-hidden"
        style={{ maxHeight: open ? "200px" : "0px" }}
      >
        <div className="px-3 pb-3 space-y-2">
          {AGENCE_ROLES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon
                className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${!isElite && !highlighted ? "text-primary" : ""}`}
                style={isElite ? { color: "rgba(232,81,26,0.7)" } : undefined}
              />
              <span className={`text-xs font-sans leading-snug ${
                isElite ? "text-white/80" : highlighted ? "text-background/80" : "text-foreground/80"
              }`}>
                <span className="font-semibold">{label}</span>
                {" · "}
                <span className={
                  isElite ? "text-white/50" : highlighted ? "text-background/60" : "text-muted-foreground"
                }>{desc}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */

interface PricingSectionProps {
  onSelectPlan?: (slug: string) => void;
}

export function PricingSection({ onSelectPlan }: PricingSectionProps = {}) {
  const navigate = useNavigate();
  const { data: plans, isLoading } = usePlans();
  const [selectedDuree, setSelectedDuree] = useState(1);
  const [eliteModalOpen, setEliteModalOpen] = useState(false);

  // Load plan_configs (public read, no auth needed)
  const { data: planConfigs, error: planConfigsError } = useQuery({
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

  // ── Debug logging ─────────────────────────────────────────
  useEffect(() => {
    console.log("[PricingSection] selectedDuree changed to:", selectedDuree, "→ re-render triggered");
    console.log("[PricingSection] planConfigs rows:", (planConfigs ?? []).length, planConfigs);
    if (planConfigsError) console.error("[PricingSection] planConfigsError:", planConfigsError);
    console.log("[PricingSection] plans:", (plans ?? []).map(p => `${p.slug}(${p.prix_mensuel})`).join(", "));
  }, [planConfigs, planConfigsError, selectedDuree, plans]);

  // Get configured price for a plan at the selected duration
  const getConfigPrice = (slug: string, duree: number): number | null => {
    const planType = SLUG_TO_PLAN_TYPE[slug ?? ""];
    if (!planType) return null;
    // Use Number() coercion — Supabase may return duree_mois as string
    const config = (planConfigs ?? []).find(
      (c) => c.plan_type === planType && Number(c.duree_mois) === Number(duree)
    );
    return config?.prix_fcfa ?? null;
  };

  // Monthly base price for a plan
  const getMonthlyPrice = (slug: string): number | null => {
    const planType = SLUG_TO_PLAN_TYPE[slug ?? ""];
    if (!planType) return null;
    const monthly = (planConfigs ?? []).find(
      (c) => c.plan_type === planType && Number(c.duree_mois) === 1
    );
    return monthly?.prix_fcfa ?? null;
  };

  // Discount % for toggle badge, using user-specified formula: raw% - 5
  // Falls back to plans.prix_semestriel when planConfigs has no data
  const getToggleDiscountPct = (duree: number): number | null => {
    if (duree <= 1) return null;
    // Primary: from plan_configs
    const planTypes = ["solo", "agence_standard", "agence_pro"];
    const percentages: number[] = [];
    for (const pt of planTypes) {
      const monthly = (planConfigs ?? []).find((c) => c.plan_type === pt && Number(c.duree_mois) === 1);
      const target = (planConfigs ?? []).find((c) => c.plan_type === pt && Number(c.duree_mois) === Number(duree));
      if (!monthly || !target) continue;
      const raw = Math.round(((monthly.prix_fcfa * duree - target.prix_fcfa) / (monthly.prix_fcfa * duree)) * 100);
      percentages.push(raw - 5);
    }
    if (percentages.length > 0) return percentages[0];
    // Fallback for 6 months: compute from plans.prix_semestriel vs prix_mensuel
    if (duree === 6 && plans && plans.length > 0) {
      const pcts: number[] = [];
      for (const p of plans) {
        if (!SLUG_TO_PLAN_TYPE[p.slug ?? ""]) continue; // skip freemium
        if (!p.prix_semestriel || p.prix_semestriel <= 0 || p.prix_mensuel <= 0) continue;
        const raw = Math.round(((p.prix_mensuel * 6 - p.prix_semestriel) / (p.prix_mensuel * 6)) * 100);
        if (raw > 5) pcts.push(raw - 5);
      }
      if (pcts.length > 0) return pcts[0];
    }
    // Third fallback: compute from FALLBACK_PRICES (use "solo" as representative)
    const fbMonthly = FALLBACK_PRICES["solo"]?.[1];
    const fbTarget = FALLBACK_PRICES["solo"]?.[duree];
    if (fbMonthly && fbTarget) {
      const raw = Math.round(((fbMonthly * duree - fbTarget) / (fbMonthly * duree)) * 100);
      return raw > 5 ? raw - 5 : null;
    }
    return null;
  };

  // Per-plan savings % for the savings badge below price
  const getSavingsPct = (slug: string, duree: number): number | null => {
    if (duree <= 1) return null;
    const planType = SLUG_TO_PLAN_TYPE[slug ?? ""];
    if (!planType) return null;
    const monthly = (planConfigs ?? []).find((c) => c.plan_type === planType && Number(c.duree_mois) === 1);
    const target = (planConfigs ?? []).find((c) => c.plan_type === planType && Number(c.duree_mois) === Number(duree));
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

        {/* Duration toggle — always visible */}
        <div className="flex justify-center mb-10 overflow-x-auto px-4">
          <div className="inline-flex bg-muted rounded-lg p-1 gap-1 min-w-max">
            {SHOWN_DURATIONS.map((d) => {
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

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {plans?.map((plan) => {
              const slug = plan.slug ?? "";
              const planType = SLUG_TO_PLAN_TYPE[slug] ?? null;
              const configPrice = getConfigPrice(slug, selectedDuree);

              // Effective price for selected duration:
              // 1) plan_configs  2) plans.prix_semestriel (6m only)  3) FALLBACK_PRICES
              // NOTE: FALLBACK_PRICES applies to ALL durations (including 1) to avoid
              // falling back to plan.prix_mensuel which may be stale/incorrect.
              const effectivePrice: number | null = (() => {
                if (configPrice !== null) return configPrice;
                if (
                  selectedDuree === 6 &&
                  plan.prix_semestriel != null &&
                  plan.prix_semestriel > 0
                ) return plan.prix_semestriel;
                if (planType) {
                  const fallback = FALLBACK_PRICES[planType]?.[selectedDuree];
                  if (fallback != null) return fallback;
                }
                return null;
              })();

              console.log(
                `[PricingSection] plan=${slug} planType=${planType} duree=${selectedDuree}`,
                `| planConfigs rows=${(planConfigs ?? []).length}`,
                `| configPrice=${configPrice}`,
                `| effectivePrice=${effectivePrice}`,
                `| plan.prix_mensuel=${plan.prix_mensuel}`,
              );

              // Monthly reference: plan_configs → FALLBACK_PRICES → plans.prix_mensuel
              const monthlyRef =
                getMonthlyPrice(slug) ??
                (planType ? (FALLBACK_PRICES[planType]?.[1] ?? plan.prix_mensuel) : plan.prix_mensuel);

              // Display price: use effective multi-month price, promo, or monthly
              const displayPrice = effectivePrice !== null
                ? effectivePrice
                : (plan.promo_active && plan.promo_prix_mensuel != null
                    ? plan.promo_prix_mensuel
                    : plan.prix_mensuel);

              const hasPromo = effectivePrice === null && plan.promo_active && plan.promo_prix_mensuel != null;
              const hasMultiMonthPrice = effectivePrice !== null && selectedDuree > 1;

              // Suffix: show multi-month label only when we actually have a multi-month price
              const priceSuffixDisplay = hasMultiMonthPrice ? priceSuffix(selectedDuree) : "/mois";

              // "au lieu de": show full undiscounted price for multi-month selections
              const auLieuDe = hasMultiMonthPrice && monthlyRef > 0
                ? monthlyRef * selectedDuree
                : null;

              // Savings %: plan_configs → prix_semestriel → FALLBACK_PRICES
              const savingsPct = (() => {
                const fromConfig = getSavingsPct(slug, selectedDuree);
                if (fromConfig !== null) return fromConfig;
                if (
                  selectedDuree === 6 &&
                  plan.prix_semestriel != null &&
                  plan.prix_semestriel > 0 &&
                  plan.prix_mensuel > 0
                ) {
                  const raw = Math.round(
                    ((plan.prix_mensuel * 6 - plan.prix_semestriel) / (plan.prix_mensuel * 6)) * 100
                  );
                  return raw > 5 ? raw - 5 : null;
                }
                if (planType && selectedDuree > 1) {
                  const fbMonthly = FALLBACK_PRICES[planType]?.[1];
                  const fbTarget = FALLBACK_PRICES[planType]?.[selectedDuree];
                  if (fbMonthly && fbTarget) {
                    const raw = Math.round(((fbMonthly * selectedDuree - fbTarget) / (fbMonthly * selectedDuree)) * 100);
                    return raw > 5 ? raw - 5 : null;
                  }
                }
                return null;
              })();

              // Display name override
              const displayName = PLAN_DISPLAY_NAMES[slug] ?? plan.nom;
              const tagline = PLAN_TAGLINES[slug] ?? null;
              const isElite = slug === "agence_pro";

              return (
                <Card
                  key={plan.id}
                  style={isElite
                    ? { background: "#1a1a1a", border: "1.5px solid #E8511A" }
                    : undefined}
                  className={`relative flex flex-col ${
                    isElite
                      ? "shadow-xl"
                      : plan.highlighted
                      ? "bg-foreground text-background border-foreground shadow-xl scale-[1.03] z-10"
                      : "border-border/50"
                  }`}
                >
                  {plan.badge && !isElite && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground border-0 text-[10px] px-3 py-0.5 whitespace-nowrap">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col flex-1">

                    {/* ── Plan name ── */}
                    {isElite ? (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Star className="h-4 w-4 shrink-0" style={{ color: "#E8511A" }} />
                        <p className="text-sm font-sans font-semibold text-white/70">Elite</p>
                      </div>
                    ) : (
                      <p className={`text-sm font-sans font-semibold mb-0.5 ${plan.highlighted ? "text-background/70" : "text-muted-foreground"}`}>
                        {displayName}
                      </p>
                    )}

                    {/* ── Tagline ── */}
                    {tagline && (
                      <p className={`text-[11px] font-sans mb-3 leading-snug ${
                        isElite ? "text-white/40"
                        : plan.highlighted ? "text-background/50"
                        : "text-muted-foreground/70"
                      }`}>
                        {tagline}
                      </p>
                    )}

                    {/* ── Price section ── */}
                    {isElite ? (
                      <div
                        className="mb-4 py-3 px-3 rounded-lg text-center"
                        style={{ background: "rgba(232,81,26,0.08)", border: "1px solid rgba(232,81,26,0.2)" }}
                      >
                        <p
                          className="text-[10px] font-sans uppercase tracking-widest font-semibold mb-1"
                          style={{ color: "#6b7280" }}
                        >
                          Tarif sur mesure
                        </p>
                        <p className="text-base font-bold font-sans text-white">Sur devis uniquement</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-1 flex items-baseline gap-2">
                          <span className="text-3xl font-bold font-serif">
                            {displayPrice === 0 ? "Gratuit" : displayPrice.toLocaleString("fr-FR") + " FCFA"}
                          </span>
                          {displayPrice > 0 && (
                            <span className={`text-sm font-sans ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                              {priceSuffixDisplay}
                            </span>
                          )}
                        </div>

                        {auLieuDe !== null && auLieuDe !== displayPrice && (
                          <p className={`text-xs font-sans mb-1 line-through ${plan.highlighted ? "text-background/40" : "text-muted-foreground/60"}`}>
                            au lieu de {auLieuDe.toLocaleString("fr-FR")} FCFA
                          </p>
                        )}

                        {savingsPct !== null && (
                          <div className="mb-1">
                            <Badge variant="secondary" className="gap-1 text-[10px] bg-emerald-100 text-emerald-700 border-0">
                              Économisez {savingsPct}%
                            </Badge>
                          </div>
                        )}

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
                        <div className="mb-3" />
                      </>
                    )}

                    {/* ── Features ── */}
                    {isElite ? (
                      <>
                        <ul className="space-y-2.5 mb-2 flex-1">
                          <li className="flex items-start gap-2 text-sm font-sans">
                            <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#E8511A" }} />
                            <span className="text-white/80">{getMemberText(plan)}</span>
                          </li>
                          {ELITE_FEATURES_BASE.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm font-sans">
                              <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#E8511A" }} />
                              <span className="text-white/80">{f}</span>
                            </li>
                          ))}
                        </ul>
                        <AgenceRolesAccordion highlighted={false} isElite={true} />
                      </>
                    ) : (
                      (() => {
                        const isAgence = slug?.includes("agence") || plan.nom?.toLowerCase().includes("agence");
                        const memberText = getMemberText(plan);
                        return (
                          <>
                            <ul className="space-y-2.5 mb-2 flex-1">
                              {memberText && (
                                <li className="flex items-start gap-2 text-sm font-sans">
                                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                                  <span className={plan.highlighted ? "text-background/80" : ""}>{memberText}</span>
                                </li>
                              )}
                              {plan.features.map((f) => {
                                const renamed = FEATURE_RENAME_MAP[f] ?? f;
                                const display = isAgence ? (AGENCE_FEATURE_MAP[renamed] ?? renamed) : renamed;
                                return (
                                  <li key={f} className="flex items-start gap-2 text-sm font-sans">
                                    <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                                    <span className={plan.highlighted ? "text-background/80" : ""}>{display}</span>
                                  </li>
                                );
                              })}
                            </ul>
                            {isAgence && <AgenceRolesAccordion highlighted={plan.highlighted} />}
                          </>
                        );
                      })()
                    )}

                    {/* ── CTA Button ── */}
                    {onSelectPlan ? (
                      <Button
                        className={`w-full gap-1.5 mt-auto ${
                          isElite
                            ? "border-0 text-white hover:opacity-90"
                            : plan.highlighted
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        }`}
                        variant={!isElite && !plan.highlighted ? "outline" : "default"}
                        style={isElite ? { background: "#E8511A" } : undefined}
                        onClick={() => onSelectPlan(slug)}
                      >
                        Choisir ce plan
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : isElite ? (
                      <Button
                        className="w-full gap-1.5 mt-auto border-0 text-white hover:opacity-90"
                        style={{ background: "#E8511A" }}
                        onClick={() => setEliteModalOpen(true)}
                      >
                        Demander un devis
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant={plan.highlighted ? "default" : "outline"}
                        className={`w-full gap-1.5 mt-auto ${
                          plan.highlighted
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        }`}
                        onClick={() => navigate("/waitlist")}
                      >
                        {plan.cta_text}
                        {plan.cta_text.includes("liste") && <ArrowRight className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stockage éphémère — mention sous les cartes */}
        <p className="text-center mt-8 text-sm font-sans text-muted-foreground flex items-center justify-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="font-medium text-foreground">Stockage éphémère intelligent</span>
            {" — médias supprimés après publication, zéro coût de stockage caché"}
          </span>
        </p>

        {plans?.some(p => p.promo_active && p.promo_label) && (
          <p className="text-center mt-4 text-sm font-sans text-muted-foreground flex items-center justify-center gap-1.5">
            <PartyPopper className="h-4 w-4 text-primary" /> {plans.find(p => p.promo_active)?.promo_label}
          </p>
        )}
      </div>

      <EliteContactModal open={eliteModalOpen} onClose={() => setEliteModalOpen(false)} />
    </section>
  );
}
