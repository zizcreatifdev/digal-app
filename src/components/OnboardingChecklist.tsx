import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, X, Check, User, Users, CalendarDays, Link2, FileText } from "lucide-react";
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

export function OnboardingChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [steps, setSteps] = useState<ChecklistStep[]>([
    { id: 1, label: "Configure ton profil", description: "Logo, couleurs et nom de marque", badge: "Identité créée", icon: User, href: "/dashboard/parametres", done: false },
    { id: 2, label: "Ajoute ton premier client", description: "Crée une fiche client avec ses réseaux", badge: "Premier client", icon: Users, href: "/dashboard/clients", done: false },
    { id: 3, label: "Crée ton premier post", description: "Planifie un contenu sur le calendrier", badge: "Calendrier lancé", icon: CalendarDays, href: "/dashboard/calendrier", done: false },
    { id: 4, label: "Génère un lien de validation", description: "Partage un aperçu avec ton client", badge: "Prêt pour le client", icon: Link2, href: "/dashboard/clients", done: false },
    { id: 5, label: "Crée ton premier devis", description: "Découvre le module facturation", badge: "Pro complet 🎉", icon: FileText, href: "/dashboard/facturation", done: false },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem(DISMISS_KEY);
    if (saved === "true") setDismissed(true);
  }, []);

  useEffect(() => {
    if (!user || dismissed) return;

    const checkProgress = async () => {
      const [profileRes, clientsRes, postsRes, linksRes, devisRes] = await Promise.all([
        supabase.from("users").select("prenom, nom, logo_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("preview_links").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "devis"),
      ]);

      const profileDone = !!(profileRes.data?.prenom && profileRes.data?.nom && profileRes.data?.logo_url);
      const clientsDone = (clientsRes.count ?? 0) > 0;
      const postsDone = (postsRes.count ?? 0) > 0;
      const linksDone = (linksRes.count ?? 0) > 0;
      const devisDone = (devisRes.count ?? 0) > 0;

      setSteps(prev => prev.map(s => ({
        ...s,
        done: s.id === 1 ? profileDone
          : s.id === 2 ? clientsDone
          : s.id === 3 ? postsDone
          : s.id === 4 ? linksDone
          : devisDone,
      })));
    };

    checkProgress();
  }, [user, dismissed]);

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;
  const progress = (completedCount / steps.length) * 100;

  // Auto-dismiss after all steps done (after short delay)
  useEffect(() => {
    if (allDone && completedCount > 0) {
      const t = setTimeout(() => {
        localStorage.setItem(DISMISS_KEY, "true");
        setDismissed(true);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [allDone, completedCount]);

  if (dismissed || !user) return null;

  return (
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
            onClick={(e) => {
              e.stopPropagation();
              localStorage.setItem(DISMISS_KEY, "true");
              setDismissed(true);
            }}
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
                🎉 Bravo ! Toutes les étapes sont complètes.
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
                onClick={() => {
                  localStorage.setItem(DISMISS_KEY, "true");
                  setDismissed(true);
                }}
              >
                Masquer définitivement
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
