import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, Mail, Users, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MarketingEmail {
  id: string;
  objet: string;
  corps: string;
  destinataires: string;
  date_envoi: string | null;
  statut: string;
  nb_destinataires: number;
  created_at: string;
}

interface Recipient {
  email: string;
  prenom: string | null;
  nom: string | null;
}

const destinataireOptions = [
  { value: "tous", label: "Tous les utilisateurs" },
  { value: "freemium", label: "Freemium uniquement" },
  { value: "licencies", label: "Licenciés uniquement" },
  { value: "cm_pro", label: "CM Pro (Solo Standard)" },
  { value: "studio", label: "Studio (Agence Standard)" },
  { value: "inactifs", label: "Inactifs (30+ jours)" },
  { value: "waitlist", label: "Liste d'attente" },
];

const statutColors: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  planifie: "bg-warning/10 text-warning",
  envoye: "bg-success/10 text-success",
};

const AdminEmails = () => {
  const [emails, setEmails] = useState<MarketingEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [form, setForm] = useState({
    objet: "",
    corps: "",
    destinataires: "tous",
    date_envoi: "",
    statut: "brouillon",
  });

  // Send state
  const [emailToSend, setEmailToSend] = useState<MarketingEmail | null>(null);
  const [confirmCount, setConfirmCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  // Confirm dialog: compute up-to-date recipient count
  useEffect(() => {
    if (emailToSend) {
      setConfirmCount(null);
      computeDestinataires(emailToSend.destinataires).then(setConfirmCount);
    } else {
      setConfirmCount(null);
    }
  }, [emailToSend]);

  const fetchEmails = async () => {
    const { data } = await supabase
      .from("marketing_emails")
      .select("*")
      .order("created_at", { ascending: false });
    setEmails((data as MarketingEmail[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchEmails(); }, []);

  useEffect(() => {
    setRecipientCount(null);
    computeDestinataires(form.destinataires).then(setRecipientCount);
  }, [form.destinataires]); // eslint-disable-line react-hooks/exhaustive-deps

  const computeDestinataires = async (target: string): Promise<number> => {
    if (target === "waitlist") {
      const { count } = await supabase.from("waitlist").select("*", { count: "exact", head: true });
      return count ?? 0;
    }
    if (target === "freemium") {
      const { count } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "freemium");
      return count ?? 0;
    }
    if (target === "licencies") {
      const { count } = await supabase.from("users").select("*", { count: "exact", head: true }).neq("role", "freemium");
      return count ?? 0;
    }
    if (target === "cm_pro") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any).from("users").select("*", { count: "exact", head: true }).eq("plan", "solo_standard");
      return (count as number) ?? 0;
    }
    if (target === "studio") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any).from("users").select("*", { count: "exact", head: true }).eq("plan", "agence_standard");
      return (count as number) ?? 0;
    }
    if (target === "inactifs") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any).from("users").select("*", { count: "exact", head: true }).lt("updated_at", cutoff.toISOString());
      return (count as number) ?? 0;
    }
    const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
    return count ?? 0;
  };

  const getRecipients = async (target: string): Promise<Recipient[]> => {
    if (target === "waitlist") {
      const { data } = await supabase.from("waitlist").select("email, prenom, nom");
      return (data as unknown as Recipient[]) ?? [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base = (supabase as any).from("users").select("email, prenom, nom");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    let res: { data: Recipient[] | null };
    if (target === "freemium") res = await base.eq("role", "freemium");
    else if (target === "licencies") res = await base.neq("role", "freemium");
    else if (target === "cm_pro") res = await base.eq("plan", "solo_standard");
    else if (target === "studio") res = await base.eq("plan", "agence_standard");
    else if (target === "inactifs") res = await base.lt("updated_at", cutoff.toISOString());
    else res = await base;

    return res.data ?? [];
  };

  const handleSend = async (campaign: MarketingEmail) => {
    setSending(true);
    setEmailToSend(null);

    const recipients = await getRecipients(campaign.destinataires);

    if (recipients.length === 0) {
      setSending(false);
      toast.error("Aucun destinataire trouvé pour ce segment");
      return;
    }

    setSendProgress({ current: 0, total: recipients.length });

    const BATCH = 10;
    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (recipient) => {
          const html = (campaign.corps ?? "")
            .replace(/\[Prénom\]/g, recipient.prenom ?? "")
            .replace(/\[Nom\]/g, recipient.nom ?? "");
          try {
            await supabase.functions.invoke("send-email", {
              body: {
                type: "marketing",
                to: recipient.email,
                subject: campaign.objet,
                html,
              },
            });
          } catch (err) {
            console.warn(`[AdminEmails] send failed for ${recipient.email}:`, err);
          }
        })
      );
      setSendProgress({ current: Math.min(i + BATCH, recipients.length), total: recipients.length });
    }

    await supabase.from("marketing_emails").update({
      statut: "envoye",
      date_envoi: new Date().toISOString(),
      nb_destinataires: recipients.length,
    }).eq("id", campaign.id);

    setSending(false);
    setSendProgress({ current: 0, total: 0 });
    toast.success(`Campagne envoyée à ${recipients.length} destinataire${recipients.length > 1 ? "s" : ""}`);
    fetchEmails();
  };

  const handleSave = async () => {
    if (!form.objet.trim()) { toast.error("L'objet est requis"); return; }
    const nb = await computeDestinataires(form.destinataires);
    const statut = form.date_envoi ? "planifie" : form.statut;

    const { error } = await supabase.from("marketing_emails").insert({
      objet: form.objet,
      corps: form.corps,
      destinataires: form.destinataires,
      date_envoi: form.date_envoi || null,
      statut,
      nb_destinataires: nb,
    });

    if (error) { toast.error("Erreur lors de la sauvegarde"); return; }
    toast.success("Email créé");
    setModalOpen(false);
    setForm({ objet: "", corps: "", destinataires: "tous", date_envoi: "", statut: "brouillon" });
    fetchEmails();
  };

  const handleDuplicate = async (email: MarketingEmail) => {
    await supabase.from("marketing_emails").insert({
      objet: `${email.objet} (copie)`,
      corps: email.corps,
      destinataires: email.destinataires,
      statut: "brouillon",
      nb_destinataires: email.nb_destinataires,
    });
    toast.success("Email dupliqué");
    fetchEmails();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("marketing_emails").delete().eq("id", id);
    toast.success("Email supprimé");
    fetchEmails();
  };

  const stats = {
    total: emails.length,
    envoyes: emails.filter(e => e.statut === "envoye").length,
    planifies: emails.filter(e => e.statut === "planifie").length,
    brouillons: emails.filter(e => e.statut === "brouillon").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 text-center">
            <Mail className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold font-serif">{stats.total}</p>
            <p className="text-xs text-muted-foreground font-sans">Total</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <Send className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold font-serif">{stats.envoyes}</p>
            <p className="text-xs text-muted-foreground font-sans">Envoyés</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-serif">{stats.planifies}</p>
            <p className="text-xs text-muted-foreground font-sans">Planifiés</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-serif">{stats.brouillons}</p>
            <p className="text-xs text-muted-foreground font-sans">Brouillons</p>
          </CardContent></Card>
        </div>

        {/* Progress banner */}
        {sending && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-sans font-medium">Envoi en cours...</span>
                </div>
                <span className="text-sm text-muted-foreground font-sans">
                  {sendProgress.current}/{sendProgress.total} emails
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{
                    width: `${sendProgress.total > 0
                      ? Math.round((sendProgress.current / sendProgress.total) * 100)
                      : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-semibold">Campagnes</h2>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nouvel email
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans">Objet</TableHead>
                  <TableHead className="font-sans">Destinataires</TableHead>
                  <TableHead className="font-sans">Nb</TableHead>
                  <TableHead className="font-sans">Date envoi</TableHead>
                  <TableHead className="font-sans">Statut</TableHead>
                  <TableHead className="font-sans text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
                ) : emails.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun email</TableCell></TableRow>
                ) : emails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium font-sans">{email.objet}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-sans text-xs">
                        {destinataireOptions.find(d => d.value === email.destinataires)?.label ?? email.destinataires}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="font-sans text-sm">{email.nb_destinataires}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-sans text-sm">
                      {email.date_envoi
                        ? format(new Date(email.date_envoi), "dd MMM yyyy HH:mm", { locale: fr })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statutColors[email.statut] ?? "bg-muted"}>
                        {email.statut === "envoye" ? "Envoyé" : email.statut === "planifie" ? "Planifié" : "Brouillon"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {email.statut !== "envoye" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Envoyer"
                            disabled={sending}
                            onClick={() => setEmailToSend(email)}
                          >
                            <Send className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicate(email)} title="Dupliquer">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Supprimer" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer l'email</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. L'email sera définitivement supprimé.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(email.id)}
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Send confirmation dialog */}
        <AlertDialog
          open={emailToSend !== null}
          onOpenChange={(open) => { if (!open) setEmailToSend(null); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Envoyer la campagne</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmCount === null
                  ? "Calcul du nombre de destinataires..."
                  : `Envoyer cette campagne à ${confirmCount} destinataire${confirmCount > 1 ? "s" : ""} ?`
                }
                {" "}Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEmailToSend(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                disabled={confirmCount === null}
                onClick={() => { if (emailToSend) handleSend(emailToSend); }}
              >
                <Send className="h-4 w-4" /> Envoyer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create email modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Nouvel email marketing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-sans text-sm">Objet</Label>
                <Input
                  value={form.objet}
                  onChange={e => setForm(f => ({ ...f, objet: e.target.value }))}
                  placeholder="Objet de l'email"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-sm">Corps du message</Label>
                <Textarea
                  value={form.corps}
                  onChange={e => setForm(f => ({ ...f, corps: e.target.value }))}
                  placeholder={"Contenu de l'email...\nUtilisez [Prénom] et [Nom] pour personnaliser."}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground font-sans">
                  Variables disponibles : <code>[Prénom]</code>, <code>[Nom]</code>
                </p>
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-sm">Destinataires</Label>
                <Select value={form.destinataires} onValueChange={v => setForm(f => ({ ...f, destinataires: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {destinataireOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {recipientCount !== null && (
                  <p className="text-xs text-muted-foreground font-sans flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {recipientCount} destinataire{recipientCount !== 1 ? "s" : ""} concerné{recipientCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-sm">Date d'envoi (vide = brouillon)</Label>
                <Input
                  type="datetime-local"
                  value={form.date_envoi}
                  onChange={e => setForm(f => ({ ...f, date_envoi: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
                <Button onClick={handleSave}>Sauvegarder</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEmails;
