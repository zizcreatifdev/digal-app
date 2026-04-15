import { useState, useEffect } from "react";

interface UserNameProfile { prenom: string; nom: string; }
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Salaire, upsertSalaire, markSalairePaid } from "@/lib/comptabilite";
import { supabase } from "@/integrations/supabase/client";
import { formatFCFA, METHODE_LABELS } from "@/lib/facturation";

interface Props {
  salaires: Salaire[];
  mois: string;
  onRefresh: () => void;
}

export function MasseSalarialeSection({ salaires, mois, onRefresh }: Props) {
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<string | null>(null);
  const [membreNom, setMembreNom] = useState("");
  const [salaireMensuel, setSalaireMensuel] = useState(0);
  const [inclureFacture, setInclureFacture] = useState(true);
  const [payMethode, setPayMethode] = useState("wave");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserNameProfile | null>(null);

  // Check if current user is in salaires for this month; auto-add if not
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: prof } = await supabase.from("users").select("prenom, nom").eq("user_id", user.id).maybeSingle();
      setProfile(prof);
    };
    init();
  }, [user]);

  const userInSalaires = salaires.some(
    (s) => profile && s.membre_nom === `${profile.prenom} ${profile.nom}`
  );

  const handleAddSelf = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      await upsertSalaire({
        user_id: user.id,
        membre_nom: `${profile.prenom} ${profile.nom}`,
        salaire_mensuel: 0,
        mois,
        inclure_facture: true,
      });
      toast.success("Votre ligne a été ajoutée, définissez votre salaire");
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const totalMasse = salaires.reduce((s, sal) => s + sal.salaire_mensuel, 0);
  const totalPaye = salaires.filter((s) => s.statut_paiement === "paye").reduce((s, sal) => s + sal.salaire_mensuel, 0);

  const handleAdd = async () => {
    if (!user || !membreNom.trim()) return;
    setLoading(true);
    try {
      await upsertSalaire({
        user_id: user.id,
        membre_nom: membreNom.trim(),
        salaire_mensuel: salaireMensuel,
        mois,
        inclure_facture: inclureFacture,
      });
      toast.success("Membre ajouté");
      setAddOpen(false);
      setMembreNom("");
      setSalaireMensuel(0);
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!payOpen) return;
    setLoading(true);
    try {
      await markSalairePaid(payOpen, payMethode);
      toast.success("Salaire marqué comme payé");
      setPayOpen(null);
      onRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span>Masse totale : <strong>{formatFCFA(totalMasse)}</strong></span>
          <span>Payé : <strong className="text-emerald-600">{formatFCFA(totalPaye)}</strong></span>
          <span>Restant : <strong className="text-amber-600">{formatFCFA(totalMasse - totalPaye)}</strong></span>
        </div>
        <div className="flex gap-2">
          {!userInSalaires && profile && (
            <Button variant="outline" onClick={handleAddSelf} disabled={loading}>
              M'ajouter
            </Button>
          )}
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter membre
          </Button>
        </div>
      </div>

      {salaires.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Aucun membre pour ce mois</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Salaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date paiement</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Facture</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaires.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.membre_nom}</TableCell>
                  <TableCell>{formatFCFA(s.salaire_mensuel)}</TableCell>
                  <TableCell>
                    <Badge className={s.statut_paiement === "paye" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                      {s.statut_paiement === "paye" ? "Payé" : "Non payé"}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.date_paiement ?? "-"}</TableCell>
                  <TableCell>{s.methode_paiement ? (METHODE_LABELS[s.methode_paiement] ?? s.methode_paiement) : "-"}</TableCell>
                  <TableCell>{s.inclure_facture ? "Oui" : "Non"}</TableCell>
                  <TableCell className="text-right">
                    {s.statut_paiement !== "paye" && (
                      <Button variant="outline" size="sm" onClick={() => setPayOpen(s.id)}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Payer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add member dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif">Ajouter un membre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du membre</Label>
              <Input value={membreNom} onChange={(e) => setMembreNom(e.target.value)} placeholder="Ex : Fatou Diop" />
            </div>
            <div>
              <Label>Salaire mensuel (FCFA)</Label>
              <Input type="number" min={0} value={salaireMensuel} onChange={(e) => setSalaireMensuel(parseInt(e.target.value) || 0)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={inclureFacture} onCheckedChange={(v) => setInclureFacture(!!v)} />
              Inclure dans la facture récapitulative
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button onClick={handleAdd} disabled={loading || !membreNom.trim()}>
                {loading ? "..." : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay dialog */}
      <Dialog open={!!payOpen} onOpenChange={(open) => !open && setPayOpen(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif">Marquer comme payé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Méthode de paiement</Label>
              <Select value={payMethode} onValueChange={setPayMethode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPayOpen(null)}>Annuler</Button>
              <Button onClick={handlePay} disabled={loading}>
                {loading ? "..." : "Confirmer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
