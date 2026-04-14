import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Tag, PartyPopper } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { Skeleton } from "@/components/ui/skeleton";

export function PricingSection() {
  const navigate = useNavigate();
  const { data: plans, isLoading } = usePlans();

  return (
    <section className="py-20 md:py-28 bg-card" id="tarifs">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Simple, transparent, FCFA
          </h2>
          <p className="text-muted-foreground font-sans text-lg max-w-xl mx-auto">
            Commencez gratuitement. Passez à la licence quand vous êtes prêt.
          </p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans?.map((plan) => {
              const displayPrice = plan.promo_active && plan.promo_prix_mensuel != null
                ? plan.promo_prix_mensuel
                : plan.prix_mensuel;
              const hasPromo = plan.promo_active && plan.promo_prix_mensuel != null;
              const promoSemestriel = hasPromo && plan.prix_semestriel
                ? Math.round(plan.promo_prix_mensuel! * 5)
                : plan.prix_semestriel;

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
                    <p className={`text-sm font-sans font-semibold mb-3 ${plan.highlighted ? "text-background/70" : "text-muted-foreground"}`}>
                      {plan.nom}
                    </p>

                    <div className="mb-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-serif">
                        {displayPrice === 0 ? "Gratuit" : displayPrice.toLocaleString("fr-FR") + " FCFA"}
                      </span>
                      {displayPrice > 0 && (
                        <span className={`text-sm font-sans ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                          /mois
                        </span>
                      )}
                    </div>

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

                    {promoSemestriel != null && promoSemestriel > 0 ? (
                      <p className={`text-xs font-sans mb-5 ${plan.highlighted ? "text-background/50" : "text-muted-foreground"}`}>
                        {promoSemestriel.toLocaleString("fr-FR")} FCFA / 6 mois
                      </p>
                    ) : (
                      <div className="mb-5" />
                    )}

                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm font-sans">
                          <Check className={`h-4 w-4 shrink-0 mt-0.5 text-primary`} />
                          <span className={plan.highlighted ? "text-background/80" : ""}>{f}</span>
                        </li>
                      ))}
                    </ul>

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
