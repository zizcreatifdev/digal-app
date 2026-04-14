import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, Link2, Receipt, ArrowUpRight, Plus,
  Lock, Clock, CheckCircle, AlertTriangle, UserPlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getAccountAccess } from "@/lib/account-access";

const recentActivity = [
  { id: 1, action: "Client Acme Corp ajouté", time: "Il y a 10 min", icon: UserPlus, color: "text-success" },
  { id: 2, action: "Post Instagram validé par TechVision", time: "Il y a 1h", icon: CheckCircle, color: "text-success" },
  { id: 3, action: "Lien de validation envoyé à DataFlow", time: "Il y a 2h", icon: Link2, color: "text-primary" },
  { id: 4, action: "Calendrier mis à jour — 3 posts ajoutés", time: "Il y a 4h", icon: Clock, color: "text-warning" },
  { id: 5, action: "Nouveau post brouillon créé", time: "Hier", icon: FileText, color: "text-muted-foreground" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState<{ role?: string | null; plan?: string | null } | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const [{ data: prof }, { data: onb }] = await Promise.all([
        supabase.from("users").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("site_settings").select("id").eq("key", `onboarding_done_${user.id}`).maybeSingle(),
      ]);
      setProfile(prof);
      if (!onb) setShowOnboarding(true);
      setCheckingOnboarding(false);
    };
    check();
  }, [user]);

  const { isFreemium } = getAccountAccess(profile);

  if (checkingOnboarding) return null;

  if (showOnboarding && profile) {
    return <OnboardingWizard profile={profile} onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <DashboardLayout pageTitle="Tableau de bord">
      <div className="animate-fade-in space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-muted-foreground font-sans mt-1">
              Vue d'ensemble de votre activité
            </p>
          </div>
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Ajouter un client
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Clients actifs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground">
                Clients actifs
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">
                {isFreemium ? "2" : "12"}
              </div>
              {isFreemium && (
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="warning" className="text-[10px]">2/2</Badge>
                  <span className="text-xs text-muted-foreground font-sans">limite Freemium</span>
                </div>
              )}
              {!isFreemium && (
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-success" />
                  <span className="text-xs text-success font-sans font-medium">+3 ce mois</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Posts à publier */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground">
                Posts cette semaine
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">7</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground font-sans">3 publiés · 4 programmés</span>
              </div>
            </CardContent>
          </Card>

          {/* Liens en attente */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground">
                Liens en attente
              </CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">3</div>
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 text-warning" />
                <span className="text-xs text-warning font-sans font-medium">1 en retard</span>
              </div>
            </CardContent>
          </Card>

          {/* Factures impayées — locked */}
          <Card
            className={isFreemium ? "opacity-60 cursor-pointer" : ""}
            onClick={() => isFreemium && setUpgradeModal(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-sans text-muted-foreground flex items-center gap-1.5">
                Factures impayées
                {isFreemium && <Lock className="h-3 w-3" />}
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isFreemium ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold font-serif text-muted-foreground">—</div>
                  <Badge variant="outline" className="text-[10px]">
                    <Lock className="h-2.5 w-2.5 mr-1" />
                    Pro uniquement
                  </Badge>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold font-serif">2</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-destructive font-sans font-medium">150 000 FCFA</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                  <span className="text-sm font-sans flex-1">{item.action}</span>
                  <span className="text-xs text-muted-foreground font-sans whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProUpgradeModal
        open={upgradeModal}
        onOpenChange={setUpgradeModal}
        featureName="Facturation"
      />
    </DashboardLayout>
  );
};

export default Dashboard;
