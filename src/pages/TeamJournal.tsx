import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTeamMemberStats } from "@/lib/creator-workflow";
import { Loader2, Users } from "lucide-react";

interface MemberRow {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  stats: { total: number; completed: number; rejected: number };
}

const TeamJournal = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadTeam();
  }, [user]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      // Get current user's agence_id
      const { data: profile } = await supabase
        .from("users")
        .select("agence_id")
        .eq("user_id", user!.id)
        .single();

      if (!profile?.agence_id) {
        // Solo user — show themselves
        const stats = await getTeamMemberStats(user!.id);
        const { data: selfProfile } = await supabase.from("users").select("*").eq("user_id", user!.id).maybeSingle();
        if (selfProfile) {
          setMembers([{
            id: selfProfile.id,
            prenom: selfProfile.prenom,
            nom: selfProfile.nom,
            email: selfProfile.email,
            role: selfProfile.role,
            stats,
          }]);
        }
        setLoading(false);
        return;
      }

      // Get team members
      const { data: team } = await supabase
        .from("users")
        .select("*")
        .eq("agence_id", profile.agence_id);

      const rows: MemberRow[] = [];
      for (const m of team ?? []) {
        const stats = await getTeamMemberStats(m.user_id);
        rows.push({
          id: m.id,
          prenom: m.prenom,
          nom: m.nom,
          email: m.email,
          role: m.role,
          stats,
        });
      }
      setMembers(rows);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Journal d'équipe">
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal d'équipe</h1>
          <p className="text-muted-foreground font-sans mt-1">
            Suivi des performances de votre équipe
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-sans">Aucun membre d'équipe trouvé.</p>
            <p className="text-xs text-muted-foreground font-sans mt-1">
              Les membres apparaîtront ici une fois rattachés à votre agence.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <Card key={member.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{member.prenom} {member.nom}</CardTitle>
                    <Badge variant="secondary" className="text-[10px] capitalize">{member.role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans">{member.email}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-lg font-bold font-serif">{member.stats.total}</p>
                      <p className="text-[10px] text-muted-foreground font-sans">Assignées</p>
                    </div>
                    <div className="rounded-lg bg-success/10 p-2">
                      <p className="text-lg font-bold font-serif text-success">{member.stats.completed}</p>
                      <p className="text-[10px] text-muted-foreground font-sans">Complétées</p>
                    </div>
                    <div className="rounded-lg bg-destructive/10 p-2">
                      <p className="text-lg font-bold font-serif text-destructive">{member.stats.rejected}</p>
                      <p className="text-[10px] text-muted-foreground font-sans">Rejets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamJournal;
