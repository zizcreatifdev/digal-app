import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";

export function HeroSection() {
  const { timeLeft, isLaunched, showCountdown, loading } = useCountdown();

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="relative pt-32 pb-8 md:pt-40 md:pb-12 overflow-hidden">
      <div className="container mx-auto px-4 text-center max-w-4xl">
        {/* Badge */}
        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-sans border-primary/30 text-primary gap-1.5">
          <Sparkles className="h-3 w-3" />
          Lancement imminent · Places limitées
        </Badge>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
          La plateforme des{" "}
          <span className="text-primary italic">Community Managers</span>{" "}
          sérieux
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground font-sans max-w-2xl mx-auto mb-8 leading-relaxed">
          Planification, validation client, facturation et comptabilité : tout en un seul outil pensé pour le marché sénégalais.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {isLaunched ? (
            <Button size="lg" className="gap-2 px-8 text-base w-full sm:w-auto" asChild>
              <Link to="/waitlist">
                Créer mon compte
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" className="gap-2 px-8 text-base w-full sm:w-auto" asChild>
                <Link to="/waitlist">
                  Rejoindre la liste d'attente
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 text-base w-full sm:w-auto" asChild>
                <a href="#fonctionnalites">Découvrir Digal</a>
              </Button>
            </>
          )}
        </div>

        {/* Countdown */}
        {!loading && showCountdown && (
          <div className="mb-8">
            {isLaunched ? (
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-6 py-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-serif font-bold text-foreground">
                  Digal est lancé — rejoignez-nous !
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 md:gap-4">
                {[
                  { value: pad(timeLeft.days), label: "Jours" },
                  { value: pad(timeLeft.hours), label: "Heures" },
                  { value: pad(timeLeft.minutes), label: "Min" },
                  { value: pad(timeLeft.seconds), label: "Sec" },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-3 md:gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl md:text-5xl font-bold font-serif text-foreground tabular-nums">
                        {item.value}
                      </span>
                      <span className="text-[10px] md:text-xs text-muted-foreground font-sans uppercase tracking-widest mt-1">
                        {item.label}
                      </span>
                    </div>
                    {i < 3 && (
                      <span className="text-2xl md:text-4xl font-light text-muted-foreground/40 -mt-4">
                        :
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
