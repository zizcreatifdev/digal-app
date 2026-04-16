import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendActivationEmail } from "@/lib/emails";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Users, Crown } from "lucide-react";

interface UserRow {
  id: string;
  user_id: string;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  agence_id: string | null;
  avatar_url: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  dm: "DM",
  agence_standard: "DM",
  agence_pro: "DM Agence Pro",
  cm: "CM",
  createur: "Créateur",
  freemium: "Freemium",
  solo: "Solo",
};

function getRoleBadgeClass(role: string): string {
  if (role === "dm" || role?.startsWith("agence")) return "bg-[#C4522A] text-white border-transparent";
  if (role === "cm") return "bg-muted text-muted-foreground border-transparent";
  if (role === "createur") return "bg-blue-100 text-blue-800 border-transparent";
  return "";
}

const TeamJournal = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("cm");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadTeam = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: prof } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(prof);

      if (prof?.agence_id) {
        const { data: team } = await supabase
          .from("users")
          .select("*")
          .eq("agence_id", prof.agence_id)
          .order("created_at");
        setTeamMembers(team ?? []);
      } else {
        setTeamMembers(prof ? [prof] : []);
      }
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isAgence = profile?.role === "dm" || profile?.role?.startsWith("agence");
  const isFreemiumOrSolo = profile?.role === "freemium" || profile?.role === "solo";

  const handleInvite = async () => {
    if (!inviteEmail || !profile) return;
    setInviteLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tokenData, error: tokenErr } = await (supabase as any)
        .from("activation_tokens")
        .insert({
          email: inviteEmail,
          prenom: "",
          nom: "",
          type_compte: inviteRole,
          agence_id: profile.agence_id ?? null,
        })
        .select("token")
        .single();

      if (tokenErr || !tokenData) {
        toast.error("Erreur lors de la création du lien d'invitation.");
        return;
      }

      const activationLink = `${window.location.origin}/activate/${tokenData.token}`;
      await sendActivationEmail(inviteEmail, "", inviteRole, activationLink);
      toast.success(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail("");
    } catch {
      toast.error("Erreur lors de l'envoi de l'invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (member: UserRow) => {
    setRemovingId(member.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("users")
        .update({ agence_id: null })
        .eq("id", member.id);
      if (error) throw error;
      toast.success(`${member.prenom} ${member.nom} retiré(e) de l'équipe`);
      setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch {
      toast.error("Erreur lors de la suppression du membre.");
    } finally {
      setRemovingId(null);
    }
  };

  const sortedMembers = [...teamMembers].sort((a, b) => {
    const aIsDm = a.role === "dm" || a.role?.startsWith("agence");
    const bIsDm = b.role === "dm" || b.role?.startsWith("agence");
    if (aIsDm && !bIsDm) return -1;
    if (!aIsDm && bIsDm) return 1;
    return 0;
  });

  return (
    <DashboardLayout pageTitle="Équipe">
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Équipe</h1>
          <p className="text-muted-foreground font-sans mt-1">
            Gérez les membres de votre agence
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isFreemiumOrSolo ? (
          /* Upgrade message for Freemium / Solo */
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Crown className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-serif">Disponible en version Agence</h2>
              <p className="text-muted-foreground font-sans max-w-sm mx-auto">
                La gestion d&apos;équipe (CM, Créateurs) est réservée aux comptes Agence.
                Passez en Agence pour inviter et gérer vos collaborateurs.
              </p>
              <Button className="mt-2">
                <Crown className="h-4 w-4 mr-2" /> Passer en Agence
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Invite form — Agence only */}
            {isAgence && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Users className="h-5 w-5" /> Inviter un membre
                  </CardTitle>
                  <CardDescription>Envoyez un lien d&apos;activation par email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="collaborateur@agence.sn"
                      />
                    </div>
                    <div className="w-36">
                      <Label>Rôle</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">CM</SelectItem>
                          <SelectItem value="createur">Créateur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={() => { void handleInvite(); }}
                    disabled={inviteLoading || !inviteEmail}
                  >
                    {inviteLoading
                      ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      : <Plus className="h-4 w-4 mr-1" />}
                    Inviter
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Members list */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Membres de l&apos;équipe</CardTitle>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Aucun membre dans l&apos;équipe pour le moment.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        {isAgence && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMembers.map((m) => {
                        const isDm = m.role === "dm" || m.role?.startsWith("agence");
                        const isSelf = m.user_id === user?.id;
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {m.avatar_url ? (
                                  <img src={m.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                                ) : (
                                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                    {m.prenom?.[0]}{m.nom?.[0]}
                                  </div>
                                )}
                                {m.prenom} {m.nom}
                                {isSelf && (
                                  <Badge variant="outline" className="text-[10px] ml-1">Vous</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{m.email}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs border ${getRoleBadgeClass(m.role)}`}>
                                {isDm ? "DM" : (ROLE_LABELS[m.role] ?? m.role)}
                              </Badge>
                            </TableCell>
                            {isAgence && (
                              <TableCell>
                                {!isDm && !isSelf && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive h-7 px-2"
                                    disabled={removingId === m.id}
                                    onClick={() => handleRemove(m)}
                                  >
                                    {removingId === m.id
                                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      : <Trash2 className="h-3.5 w-3.5" />}
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamJournal;
