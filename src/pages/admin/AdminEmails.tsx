import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, Mail, Users, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type MarketingEmail = {
  id: string;
  objet: string;
  corps: string;
  destinataires: string;
  date_envoi: string | null;
  statut: string;
  nb_destinataires: number;
  created_at: string;
};

const destinataireOptions = [
  { value: "tous", label: "Tous" },
  { value: "freemium", label: "Freemium uniquement" },
  { value: "licencies", label: "Licenciés uniquement" },
  { value: "waitlist", label: "Liste d'attente uniquement" },
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
  const [form, setForm] = useState({
    objet: "",
    corps: "",
    destinataires: "tous",
    date_envoi: "",
    statut: "brouillon",
  });

  const fetchEmails = async () => {
    const { data } = await supabase
      .from("marketing_emails")
      .select("*")
      .order("created_at", { ascending: false });
    setEmails((data as MarketingEmail[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchEmails(); }, []);

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
    const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
    return count ?? 0;
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
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicate(email)} title="Dupliquer">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(email.id)} title="Supprimer" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
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
                  placeholder="Contenu de l'email..."
                  rows={8}
                />
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
