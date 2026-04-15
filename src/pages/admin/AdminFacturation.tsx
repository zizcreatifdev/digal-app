import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, FileText, TrendingUp, TrendingDown, DollarSign, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import { usePlans } from "@/hooks/usePlans";
import { ReceiptPreviewModal } from "@/components/admin/ReceiptPreviewModal";

async function loadSvgAsPng(url: string, width: number, height: number): Promise<string | null> {
  try {
    const response = await fetch(url);
    const svgText = await response.text();
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}

type OwnerPayment = {
  id: string;
  compte_nom: string;
  compte_email: string | null;
  plan: string;
  montant: number;
  methode: string;
  date_paiement: string;
  statut: string;
  created_at: string;
};

type UserAccount = {
  id: string;
  user_id: string;
  email: string;
  prenom: string;
  nom: string;
  plan: string | null;
  role: string;
  lastPaymentPlan?: string;
};

const methodeLabels: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  virement: "Virement",
  cash: "Cash",
};

// Maps user role to plan slug
const roleToPlanSlug: Record<string, string> = {
  solo: "solo_standard",
  dm: "agence_standard",
  agence_standard: "agence_standard",
  agence_pro: "agence_pro",
  freemium: "freemium",
};

const AdminFacturation = () => {
  const { data: dbPlans } = usePlans();
  const planLabels: Record<string, string> = {};
  const planPrices: Record<string, number> = {};
  (dbPlans ?? []).forEach(p => {
    planLabels[p.slug] = p.nom;
    planPrices[p.slug] = p.promo_active && p.promo_prix_mensuel != null ? p.promo_prix_mensuel : p.prix_mensuel;
  });
  const paidPlans = (dbPlans ?? []).filter(p => p.prix_mensuel > 0);

  const [payments, setPayments] = useState<OwnerPayment[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewPayment, setPreviewPayment] = useState<OwnerPayment | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [form, setForm] = useState({
    compte_nom: "",
    compte_email: "",
    plan: "solo_standard",
    montant: "",
    methode: "wave",
    date_paiement: format(new Date(), "yyyy-MM-dd"),
    statut: "paye",
  });

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("owner_payments")
      .select("*")
      .order("date_paiement", { ascending: false });
    setPayments((data as OwnerPayment[]) ?? []);
    setLoading(false);
  };

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, user_id, email, prenom, nom, plan, role")
      .neq("role", "owner")
      .order("nom");
    const accts = (data as UserAccount[]) ?? [];
    // Fetch last payment plan for each account
    const { data: lastPayments } = await supabase
      .from("owner_payments")
      .select("compte_email, plan")
      .order("date_paiement", { ascending: false });
    const lastPlanByEmail: Record<string, string> = {};
    (lastPayments ?? []).forEach((p) => {
      if (p.compte_email && !lastPlanByEmail[p.compte_email]) {
        lastPlanByEmail[p.compte_email] = p.plan;
      }
    });
    accts.forEach(a => { a.lastPaymentPlan = lastPlanByEmail[a.email]; });
    setAccounts(accts);
  };

  useEffect(() => { fetchPayments(); fetchAccounts(); }, []);

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    const acct = accounts.find(a => a.id === accountId);
    if (acct) {
      const fullName = `${acct.prenom} ${acct.nom}`.trim();
      const planSlug = roleToPlanSlug[acct.role] || acct.plan || "solo_standard";
      setForm(f => ({
        ...f,
        compte_nom: fullName,
        compte_email: acct.email,
        plan: planSlug,
        montant: String(planPrices[planSlug] || 0),
      }));
    }
  };

  const handleSave = async () => {
    if (!form.compte_nom.trim() || !form.montant) {
      toast.error("Sélectionnez un compte et vérifiez le montant");
      return;
    }
    const { error } = await supabase.from("owner_payments").insert({
      compte_nom: form.compte_nom,
      compte_email: form.compte_email || null,
      plan: form.plan,
      montant: parseInt(form.montant),
      methode: form.methode,
      date_paiement: form.date_paiement,
      statut: form.statut,
    });
    if (error) { toast.error("Erreur"); return; }
    toast.success("Paiement ajouté");
    setModalOpen(false);
    setSelectedAccountId("");
    setForm({ compte_nom: "", compte_email: "", plan: "solo_standard", montant: "", methode: "wave", date_paiement: format(new Date(), "yyyy-MM-dd"), statut: "paye" });
    fetchPayments();
  };

  // Stats
  const now = new Date();
  const moisActuel = payments.filter(p => {
    const d = new Date(p.date_paiement);
    return d >= startOfMonth(now) && d <= endOfMonth(now) && p.statut === "paye";
  });
  const moisPrecedent = payments.filter(p => {
    const prev = subMonths(now, 1);
    const d = new Date(p.date_paiement);
    return d >= startOfMonth(prev) && d <= endOfMonth(prev) && p.statut === "paye";
  });
  const totalMoisActuel = moisActuel.reduce((s, p) => s + p.montant, 0);
  const totalMoisPrecedent = moisPrecedent.reduce((s, p) => s + p.montant, 0);
  const mrr = totalMoisActuel;
  const diff = totalMoisActuel - totalMoisPrecedent;

  // CSV export
  const exportCSV = () => {
    const header = "Nom,Email,Plan,Montant FCFA,Méthode,Date,Statut\n";
    const rows = payments.map(p =>
      `"${p.compte_nom}","${p.compte_email ?? ""}","${planLabels[p.plan] ?? p.plan}",${p.montant},"${methodeLabels[p.methode] ?? p.methode}","${p.date_paiement}","${p.statut}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paiements-digal-${format(now, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getReceiptData = (p: OwnerPayment) => {
    const plan = (dbPlans ?? []).find(pl => pl.slug === p.plan);
    const features = plan?.features as unknown as string[] | undefined;
    return {
      compte_nom: p.compte_nom,
      compte_email: p.compte_email,
      plan: p.plan,
      planLabel: planLabels[p.plan] ?? p.plan,
      planFeatures: features ?? [],
      montant: p.montant,
      methode: p.methode,
      methodeLabel: methodeLabels[p.methode] ?? p.methode,
      date_paiement: p.date_paiement,
      statut: p.statut,
    };
  };

  // PDF receipt: matches preview exactly
  const downloadPDF = async (p: OwnerPayment) => {
    // Load Digal logo (SVG → PNG via canvas)
    const digalLogoData = await loadSvgAsPng(
      "/logos/Logo%20Digal-iconorange_avec_baseline_noir.svg",
      400, 192
    );

    const receiptData = getReceiptData(p);
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentW = w - margin * 2;
    const col2X = w / 2 + 5;

    // Colors
    const accent: [number, number, number] = [196, 82, 42];
    const dark: [number, number, number] = [26, 26, 26];
    const gray: [number, number, number] = [160, 160, 160];
    const bgGray: [number, number, number] = [249, 249, 249];

    // === Top accent bar ===
    doc.setFillColor(...accent);
    doc.rect(0, 0, w, 4, "F");

    // === Header: Digal logo (40×20mm) ===
    if (digalLogoData) {
      try {
        doc.addImage(digalLogoData, "PNG", margin, 7, 40, 20);
      } catch {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(...dark);
        doc.text("Digal", margin, 18);
      }
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(...dark);
      doc.text("Digal", margin, 18);
    }

    // Subtitle below logo
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text("Plateforme SaaS pour Community Managers", margin, 30);

    // Right side: Receipt title + date
    doc.setTextColor(...accent);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("REÇU DE PAIEMENT", w - margin, 16, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    const formattedDate = format(new Date(p.date_paiement), "dd MMMM yyyy", { locale: fr });
    doc.text(formattedDate, w - margin, 22, { align: "right" });

    let y = 35;

    // === Divider ===
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, w - margin, y);
    y += 8;

    // === Client info block ===
    doc.setFillColor(...bgGray);
    doc.roundedRect(margin, y, contentW, 48, 3, 3, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...gray);
    doc.text("DÉTAILS DU COMPTE", margin + 8, y + 10);

    const infoY = y + 18;
    // Row 1: Titulaire + Email
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text("Titulaire", margin + 8, infoY);
    doc.text("Email", col2X, infoY);

    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text(p.compte_nom, margin + 8, infoY + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(p.compte_email ?? "-", col2X, infoY + 5);

    // Row 2: Formule + Méthode
    const row2Y = infoY + 14;
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text("Formule", margin + 8, row2Y);
    doc.text("Méthode de paiement", col2X, row2Y);

    doc.setFontSize(9);
    doc.setTextColor(...accent);
    doc.setFont("helvetica", "bold");
    doc.text(receiptData.planLabel, margin + 8, row2Y + 5);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(receiptData.methodeLabel, col2X, row2Y + 5);

    y += 56;

    // === Amount block ===
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, y, contentW, 32, 3, 3, "S");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...gray);
    doc.text("MONTANT", margin + 8, y + 10);

    const montantStr = p.montant.toLocaleString("fr-FR").replace(/\u202F/g, " ").replace(/\u00A0/g, " ");
    doc.setFontSize(22);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text(montantStr, margin + 8, y + 22);
    const mw = doc.getStringUnitWidth(montantStr) * 22 / doc.internal.scaleFactor;
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text("FCFA", margin + 8 + mw + 2, y + 22);

    // Status badge
    const isPaid = p.statut === "paye";
    if (isPaid) {
      doc.setFillColor(236, 253, 245);
      doc.setTextColor(22, 101, 52);
    } else {
      doc.setFillColor(254, 243, 199);
      doc.setTextColor(146, 64, 14);
    }
    const badgeText = isPaid ? "Payé" : "En attente";
    const badgeW = doc.getStringUnitWidth(badgeText) * 8 / doc.internal.scaleFactor + 8;
    doc.roundedRect(w - margin - badgeW - 4, y + 12, badgeW + 4, 12, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(badgeText, w - margin - badgeW / 2 - 2, y + 20, { align: "center" });

    y += 40;

    // === Plan features ===
    if (receiptData.planFeatures && receiptData.planFeatures.length > 0) {
      const featureRowH = 5;
      const cols = 2;
      const rows = Math.ceil(receiptData.planFeatures.length / cols);
      const blockH = 14 + rows * featureRowH;

      doc.setFillColor(...bgGray);
      doc.roundedRect(margin, y, contentW, blockH, 3, 3, "F");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...gray);
      doc.text("INCLUS DANS LA FORMULE", margin + 8, y + 10);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      receiptData.planFeatures.forEach((f, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const fx = margin + 8 + col * (contentW / 2 - 4);
        const fy = y + 16 + row * featureRowH;
        doc.setTextColor(34, 197, 94);
        doc.text("✓", fx, fy);
        doc.setTextColor(100, 100, 100);
        doc.text(f, fx + 5, fy);
      });

      y += blockH + 6;
    }

    // === Footer ===
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, w - margin, y);
    y += 6;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    const ref = `DGL-${format(new Date(p.date_paiement), "yyyyMMdd")}-${p.id.substring(0, 4).toUpperCase()}`;
    doc.text(`Réf : ${ref} · Dakar, Sénégal`, margin, y);
    doc.text("ziza@digal.sn · digal.vercel.app", margin, y + 4);

    // Digal logo bottom-right
    if (digalLogoData) {
      try {
        doc.addImage(digalLogoData, "PNG", w - 35, h - 16, 20, 9.6);
      } catch {
        doc.setTextColor(180, 180, 180);
        doc.text("digal.vercel.app", w - margin, h - 10, { align: "right" });
      }
    } else {
      doc.setTextColor(180, 180, 180);
      doc.text("digal.vercel.app", w - margin, h - 10, { align: "right" });
    }

    // === Bottom accent bar ===
    doc.setFillColor(...accent);
    doc.rect(0, h - 3, w, 3, "F");

    doc.save(`recu-${p.compte_nom}-${p.date_paiement}.pdf`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-sans">MRR</p>
                <p className="text-xl font-bold font-serif">{mrr.toLocaleString("fr-FR")} FCFA</p>
              </div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-sans">Encaissé ce mois</p>
                <p className="text-xl font-bold font-serif">{totalMoisActuel.toLocaleString("fr-FR")} FCFA</p>
              </div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${diff >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                {diff >= 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-sans">vs mois précédent</p>
                <p className={`text-xl font-bold font-serif ${diff >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {diff >= 0 ? "+" : ""}{diff.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>
          </CardContent></Card>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-serif font-semibold">Paiements</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Ajouter un paiement
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans">Nom</TableHead>
                  <TableHead className="font-sans">Plan</TableHead>
                  <TableHead className="font-sans">Montant</TableHead>
                  <TableHead className="font-sans">Méthode</TableHead>
                  <TableHead className="font-sans">Date</TableHead>
                  <TableHead className="font-sans">Statut</TableHead>
                  <TableHead className="font-sans text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
                ) : payments.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun paiement</TableCell></TableRow>
                ) : payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium font-sans">{p.compte_nom}</p>
                        {p.compte_email && <p className="text-xs text-muted-foreground">{p.compte_email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-sans text-xs">{planLabels[p.plan] ?? p.plan}</Badge>
                    </TableCell>
                    <TableCell className="font-sans font-medium">{p.montant.toLocaleString("fr-FR")} FCFA</TableCell>
                    <TableCell className="font-sans text-sm">{methodeLabels[p.methode] ?? p.methode}</TableCell>
                    <TableCell className="font-sans text-sm">
                      {format(new Date(p.date_paiement), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge className={p.statut === "paye" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                        {p.statut === "paye" ? "Payé" : "En attente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setPreviewPayment(p)} title="Aperçu">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => downloadPDF(p)} title="Télécharger PDF">
                          <FileText className="h-4 w-4" />
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
              <DialogTitle className="font-serif">Ajouter un paiement reçu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-sans text-sm">Sélectionner un compte</Label>
                <Select value={selectedAccountId} onValueChange={handleSelectAccount}>
                  <SelectTrigger><SelectValue placeholder="Choisir un compte..." /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.prenom} {a.nom} · {a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedAccountId && (() => {
                const acct = accounts.find(a => a.id === selectedAccountId);
                const currentPlanSlug = roleToPlanSlug[acct?.role ?? ""] || acct?.plan || "";
                const lastPlan = acct?.lastPaymentPlan;
                const planChanged = lastPlan && lastPlan !== currentPlanSlug;
                return (
                  <div className="rounded-md border p-3 bg-muted/50 text-sm space-y-1">
                    <p><span className="font-medium">Nom :</span> {form.compte_nom}</p>
                    <p><span className="font-medium">Email :</span> {form.compte_email}</p>
                    <p><span className="font-medium">Formule actuelle :</span> {planLabels[currentPlanSlug] || currentPlanSlug}</p>
                    {planChanged && (
                      <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                        ⚠️ Changement de formule détecté, ancien plan : <strong>{planLabels[lastPlan] || lastPlan}</strong> → Nouveau : <strong>{planLabels[currentPlanSlug] || currentPlanSlug}</strong>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-sans text-sm">Plan</Label>
                  <Select value={form.plan} onValueChange={v => setForm(f => ({ ...f, plan: v, montant: String(planPrices[v] || 0) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {paidPlans.map(p => (
                        <SelectItem key={p.slug} value={p.slug}>
                          {p.nom} · {(planPrices[p.slug] || 0).toLocaleString("fr-FR")} FCFA
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-sans text-sm">Montant FCFA</Label>
                  <Input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-sans text-sm">Méthode</Label>
                  <Select value={form.methode} onValueChange={v => setForm(f => ({ ...f, methode: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wave">Wave</SelectItem>
                      <SelectItem value="orange_money">Orange Money</SelectItem>
                      <SelectItem value="virement">Virement</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-sans text-sm">Date de paiement</Label>
                  <Input type="date" value={form.date_paiement} onChange={e => setForm(f => ({ ...f, date_paiement: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-sm">Statut</Label>
                <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paye">Payé</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
                <Button onClick={handleSave}>Enregistrer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Receipt Preview */}
        <ReceiptPreviewModal
          open={!!previewPayment}
          onOpenChange={(open) => { if (!open) setPreviewPayment(null); }}
          data={previewPayment ? getReceiptData(previewPayment) : null}
          onDownload={() => { if (previewPayment) downloadPDF(previewPayment); }}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminFacturation;
