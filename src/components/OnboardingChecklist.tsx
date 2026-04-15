import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ChevronDown, ChevronUp, X, Check, User, Users, CalendarDays, Link2, FileText, Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface ChecklistStep {
  id: number;
  label: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  href: string;
  done: boolean;
}

const DISMISS_KEY = "digal_onboarding_checklist_dismissed";

const STEPS_CONFIG: Omit<ChecklistStep, "done">[] = [
  { id: 1, label: "Configure ton profil", description: "Logo, couleurs et nom de marque", badge: "Identité créée", icon: User, href: "/dashboard/parametres" },
  { id: 2, label: "Ajoute ton premier client", description: "Crée une fiche client avec ses réseaux", badge: "Premier client", icon: Users, href: "/dashboard/clients" },
  { id: 3, label: "Crée ton premier post", description: "Planifie un contenu sur le calendrier", badge: "Calendrier lancé", icon: CalendarDays, href: "/dashboard/calendrier" },
  { id: 4, label: "Génère un lien de validation", description: "Partage un aperçu avec ton client", badge: "Prêt pour le client", icon: Link2, href: "/dashboard/clients" },
  { id: 5, label: "Crée ton premier devis", description: "Découvre le module facturation", badge: "Pro complet 🎉", icon: FileText, href: "/dashboard/facturation" },
];

interface BadgeInfo {
  stepLabel: string;
  badgeName: string;
  isLast: boolean;
}

export function OnboardingChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [steps, setSteps] = useState<ChecklistStep[]>(
    STEPS_CONFIG.map((s) => ({ ...s, done: false }))
  );
  const [badgeModal, setBadgeModal] = useState<BadgeInfo | null>(null);
  // Ref to track which badge names are already known (celebrated)
  const knownBadgesRef = useRef<Set<string>>(new Set());

  // Load dismissed + known badges from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from("users") as any)
        .select("onboarding_completed, onboarding_badges")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.onboarding_completed) {
        setDismissed(true);
      } else if (localStorage.getItem(DISMISS_KEY) === "true") {
        setDismissed(true);
      }

      const badges: string[] = Array.isArray(data?.onboarding_badges) ? data.onboarding_badges : [];
      knownBadgesRef.current = new Set(badges);
      setDbLoaded(true);
    };
    load();
  }, [user]);

  // Check progress from DB
  useEffect(() => {
    if (!user || dismissed || !dbLoaded) return;

    const checkProgress = async () => {
      const [profileRes, clientsRes, postsRes, linksRes, devisRes] = await Promise.all([
        supabase.from("users").select("prenom, nom, logo_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("preview_links").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "devis"),
      ]);

      const doneMap: Record<number, boolean> = {
        1: !!(profileRes.data?.prenom && profileRes.data?.nom && profileRes.data?.logo_url),
        2: (clientsRes.count ?? 0) > 0,
        3: (postsRes.count ?? 0) > 0,
        4: (linksRes.count ?? 0) > 0,
        5: (devisRes.count ?? 0) > 0,
      };

      setSteps((prev) => prev.map((s) => ({ ...s, done: doneMap[s.id] ?? false })));

      // Detect newly completed badges (done but not yet celebrated)
      const newlyCompleted = STEPS_CONFIG.filter(
        (s) => doneMap[s.id] && !knownBadgesRef.current.has(s.badge)
      );

      if (newlyCompleted.length > 0) {
        const allNowDone = Object.values(doneMap).every(Boolean);
        const first = newlyCompleted[0];
        setBadgeModal({ stepLabel: first.label, badgeName: first.badge, isLast: allNowDone });

        // Save all new badges to DB
        const newBadgeNames = newlyCompleted.map((s) => s.badge);
        newBadgeNames.forEach((b) => knownBadgesRef.current.add(b));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("users") as any)
          .update({ onboarding_badges: [...knownBadgesRef.current] })
          .eq("user_id", user.id)
          .catch(() => {/* silent */});
      }
    };

    checkProgress();
  }, [user, dismissed, dbLoaded]);

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const progress = (completedCount / steps.length) * 100;

  const handleDismiss = async () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("users") as any)
        .update({ onboarding_completed: true })
        .eq("user_id", user.id)
        .catch(() => {/* silent */});
    }
  };

  // Auto-dismiss after all done (4 s delay)
  useEffect(() => {
    if (allDone && completedCount > 0 && dbLoaded) {
      const t = setTimeout(handleDismiss, 4000);
      return () => clearTimeout(t);
    }
  }, [allDone, completedCount, dbLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (dismissed || !user) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 w-72 rounded-xl border border-border bg-card shadow-lg">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer select-none"
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold font-sans">Démarrage rapide</span>
            <Badge variant="secondary" className="text-xs">{completedCount}/{steps.length}</Badge>
          </div>
          <div className="flex items-center gap-1">
            {collapsed ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            <button
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted ml-1"
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            {/* Progress bar */}
            <div className="px-3 pb-2">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground font-sans mt-1">{Math.round(progress)}% complété</p>
            </div>

            {/* Steps */}
            <div className="divide-y divide-border">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-start gap-3 px-3 py-2.5">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-emerald-100 text-emerald-600" : "border border-border bg-muted"}`}>
                      {step.done
                        ? <Check className="h-3 w-3" />
                        : <Icon className="h-3 w-3 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium font-sans ${step.done ? "line-through text-muted-foreground" : ""}`}>
                        {step.label}
                      </p>
                      {step.done ? (
                        <p className="text-[10px] text-emerald-600 font-sans font-medium mt-0.5">
                          Badge : {step.badge}
                        </p>
                      ) : (
                        <button
                          className="text-[10px] text-primary hover:underline font-sans mt-0.5"
                          onClick={() => navigate(step.href)}
                        >
                          {step.description} →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {allDone && (
              <div className="p-3 text-center">
                <p className="text-xs font-semibold text-emerald-600 font-sans">
                  🎉 Vous maîtrisez Digal ! Fermeture automatique…
                </p>
              </div>
            )}

            {/* Dismiss link */}
            {!allDone && (
              <div className="px-3 py-2 border-t border-border">
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-muted-foreground h-auto p-0"
                  onClick={handleDismiss}
                >
                  Masquer définitivement
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Badge unlock modal */}
      <Dialog open={!!badgeModal} onOpenChange={(v) => { if (!v) setBadgeModal(null); }}>
        <DialogContent className="sm:max-w-xs text-center">
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Animated badge icon */}
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
              </span>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest">
                Badge débloqué !
              </p>
              <p className="text-lg font-bold font-serif mt-1">{badgeModal?.badgeName}</p>
              <p className="text-sm text-muted-foreground font-sans mt-1">{badgeModal?.stepLabel}</p>
            </div>

            {badgeModal?.isLast && (
              <div className="w-full p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-semibold text-primary font-sans">
                  🎉 Vous maîtrisez Digal !
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Toutes les étapes sont complètes. Bravo !
                </p>
              </div>
            )}

            <Button className="w-full" onClick={() => setBadgeModal(null)}>
              Continuer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
