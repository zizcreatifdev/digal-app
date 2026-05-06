import { useState, useEffect, useRef, useCallback } from "react";
import jsPDF from "jspdf";
import { DIGAL_LOGO_B64 } from "@/lib/digal-logo-b64";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Download, Key, Copy, Check, Gift, CalendarPlus, AlertCircle, Search, X, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { copyToClipboard } from "@/lib/clipboard";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";

interface PlanConfig {
  id: string;
  plan_type: string;
  duree_mois: number;
  prix_fcfa: number;
  est_actif: boolean;
}

interface UserResult {
  id: string;
  user_id?: string;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  licence_expiration: string | null;
  plan: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  solo: "CM Pro",
  solo_standard: "CM Pro",
  agence_standard: "Studio",
  agence_pro: "Elite",
};

const TYPE_SHORT: Record<string, string> = {
  solo: "SOLO",
  agence_standard: "STD",
  agence_pro: "PRO",
};

const PLAN_LABEL: Record<string, string> = {
  freemium: "Freemium",
  solo: "CM Pro",
  solo_standard: "CM Pro",
  agence_standard: "Studio",
  agence_pro: "Elite",
  cm: "CM",
  createur: "Créateur",
};

function generateKeyCode(type: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  const suffix = Array.from(array).map(b => chars[b % chars.length]).join("");
  return `DIGAL-${TYPE_SHORT[type] ?? "SOLO"}-${suffix}`;
}

function formatFCFA(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toLocaleFR(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

const loadLogoBase64 = async (): Promise<string> => DIGAL_LOGO_B64;

// ── Inline invoice preview component ─────────────────────────────────────────
interface InvoicePreviewProps {
  invoiceNum: string;
  user: UserResult | null;
  planType: string;
  durationMonths: number;
  prixNormal: number;
  remisePct: number;
  remiseMontant: number;
  promoPercent: number;
  remisePromo: number;
  prixFinal: number;
  offert: boolean;
  payMethod: string;
  payRef: string;
}

function LicenceInvoicePreview({ invoiceNum, user, planType, durationMonths, prixNormal, remisePct, remiseMontant, promoPercent, remisePromo, prixFinal, offert, payMethod, payRef }: InvoicePreviewProps) {
  const today = new Date();
  const endDate = addMonths(today, durationMonths);
  const prixApresRemises = prixNormal - remiseMontant - remisePromo;

  return (
    <div style={{ fontFamily: "serif", fontSize: 11, color: "#1a1a1a", lineHeight: 1.5 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#e94e1b", letterSpacing: 1 }}>DIGAL</div>
          <div style={{ fontSize: 9, color: "#666" }}>digal.sn</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Facture de licence</div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>N° {invoiceNum}</div>
          <div style={{ fontSize: 10, color: "#555" }}>{toLocaleFR(today)}</div>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "10px 0" }} />

      {/* Billed to */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#999", marginBottom: 4 }}>Facturé à</div>
        {user ? (
          <>
            <div style={{ fontWeight: 600 }}>{user.prenom} {user.nom}</div>
            <div style={{ fontSize: 10, color: "#555" }}>{user.email}</div>
          </>
        ) : (
          <div style={{ color: "#aaa", fontStyle: "italic", fontSize: 10 }}>Sélectionner un utilisateur…</div>
        )}
      </div>

      {/* Line items */}
      <div style={{ background: "#f7f7f7", borderRadius: 4, padding: "10px 12px", marginBottom: 12 }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#999", marginBottom: 6 }}>Prestation</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
          <span>Licence {TYPE_LABELS[planType] ?? planType} — {durationMonths} mois</span>
          <span>{formatFCFA(prixNormal)}</span>
        </div>
        {remisePct > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", color: "#e94e1b", fontSize: 10, marginTop: 4 }}>
            <span>Remise {durationMonths} mois {remisePct}%</span>
            <span>- {formatFCFA(remiseMontant)}</span>
          </div>
        )}
        {promoPercent > 0 && remisePromo > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", color: "#e94e1b", fontSize: 10, marginTop: 4 }}>
            <span>Code promo {promoPercent}%</span>
            <span>- {formatFCFA(remisePromo)}</span>
          </div>
        )}
        {offert && prixApresRemises > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", color: "#e94e1b", fontSize: 10, fontWeight: 600, marginTop: 4 }}>
            <span>Offert</span>
            <span>- {formatFCFA(prixApresRemises)}</span>
          </div>
        )}
        <div style={{ fontSize: 9, color: "#777", marginTop: 4 }}>
          Du {toLocaleFR(today)} au {toLocaleFR(endDate)}
        </div>
      </div>

      {/* Total */}
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13, padding: "8px 12px", background: "#1a1a1a", color: "#fff", borderRadius: 4, marginBottom: 12 }}>
        <span>Total</span>
        <span>{offert ? "0 FCFA" : formatFCFA(prixFinal)}</span>
      </div>

      {/* Payment info */}
      {(payMethod || payRef) && (
        <div style={{ fontSize: 9, color: "#666", marginBottom: 10 }}>
          {payMethod && <div><strong>Mode :</strong> {payMethod}</div>}
          {payRef && <div><strong>Réf. :</strong> {payRef}</div>}
        </div>
      )}

      <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "10px 0" }} />
      <div style={{ fontSize: 8, color: "#aaa", textAlign: "center" }}>
        Digal · digal.sn · noreply@digal.sn
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminLicences() {
  const queryClient = useQueryClient();

  // Activate existing user dialog
  const [showActivate, setShowActivate] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("solo_standard");
  const [duree, setDuree] = useState("6");

  // Generate key dialog
  const [showGenerate, setShowGenerate] = useState(false);
  const [genType, setGenType] = useState("solo");
  const [genDuration, setGenDuration] = useState("1");
  const [generatedKey, setGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [genPromo, setGenPromo] = useState<boolean>(false);
  const [genPromoDiscount, setGenPromoDiscount] = useState("30");
  const [genOffert, setGenOffert] = useState<boolean>(false);
  const [genPayMethod, setGenPayMethod] = useState("");
  const [genPayRef, setGenPayRef] = useState("");

  // User search in generate dialog
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Confirmation dialog
  const [showSendDialog, setShowSendDialog] = useState(false);

  // Extend license dialog
  const [extendUser, setExtendUser] = useState<{ id: string; email: string; licence_expiration: string | null } | null>(null);
  const [extendMonths, setExtendMonths] = useState("3");

  const { data: planConfigs } = useQuery({
    queryKey: ["plan-configs"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("plan_configs")
        .select("id, plan_type, duree_mois, prix_fcfa, est_actif")
        .order("duree_mois");
      if (error) throw error;
      // Filter actives client-side to avoid boolean comparison issues across DB drivers
      return ((data ?? []) as PlanConfig[]).filter(c => c.est_actif);
    },
  });

  const { data: users, isLoading, isError: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-licences-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: licenseKeys, isLoading: keysLoading } = useQuery({
    queryKey: ["admin-license-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("license_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const licensedUsers = users?.filter(u => u.role !== "freemium") ?? [];

  // Retourne le prix unitaire mensuel pour un plan (depuis config 1 mois ou extrapolation)
  const getPrixMensuel = (planType: string): number => {
    const normalize = (s: unknown) => String(s ?? "").toLowerCase().trim();
    const configs = (planConfigs ?? [])
      .filter(c => normalize(c.plan_type) === normalize(planType))
      .map(c => ({ duree_mois: Number(c.duree_mois), prix_fcfa: Number(c.prix_fcfa) }))
      .sort((a, b) => a.duree_mois - b.duree_mois);
    if (configs.length === 0) return 0;
    const one = configs.find(c => c.duree_mois === 1);
    if (one) return one.prix_fcfa;
    return Math.round(configs[0].prix_fcfa / configs[0].duree_mois);
  };

  const dur = parseInt(genDuration, 10) || 1;
  const prixMensuel = getPrixMensuel(genType);
  const prixNormal = prixMensuel * dur;
  const remisePct = dur === 6 ? 12 : dur === 12 ? 17 : 0;
  const remiseMontant = Math.round(prixNormal * remisePct / 100);
  const prixApresRemiseDuree = prixNormal - remiseMontant;
  const promoPercent = genPromo ? (parseInt(genPromoDiscount, 10) || 0) : 0;
  const remisePromo = genPromo ? Math.round(prixApresRemiseDuree * promoPercent / 100) : 0;
  const prixFinal = genOffert ? 0 : (prixApresRemiseDuree - remisePromo);

  const invoiceNum = (() => {
    const year = new Date().getFullYear();
    const n = (licenseKeys?.length ?? 0) + 1;
    return `LIC-DIG-${year}-${String(n).padStart(4, "0")}`;
  })();

  // Debounced user search — tous les rôles, aucun filtre de plan
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    const { data } = await supabase
      .from("users")
      .select("id, user_id, prenom, nom, email, role, licence_expiration")
      .or(`prenom.ilike.%${q}%,nom.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);
    setSearchResults((data ?? []).map(u => ({ ...u, plan: null })) as UserResult[]);
    setSearchOpen(true);
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => doSearch(searchQuery), 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery, doSearch]);

  const handleSelectUser = (u: UserResult) => {
    setSelectedUser(u);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setSearchQuery("");
  };

  const activateLicense = useMutation({
    mutationFn: async () => {
      const expDate = new Date();
      expDate.setMonth(expDate.getMonth() + parseInt(duree));
      const { error } = await supabase.from("users").update({
        role: selectedPlan,
        licence_expiration: expDate.toISOString(),
      }).eq("id", selectedUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-licences-users"] });
      toast.success("Licence activée");
      setShowActivate(false);
    },
  });

  const generateKey = useMutation({
    mutationFn: async (action: "send" | "copy") => {
      const keyCode = generateKeyCode(genType);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("license_keys").insert({
        key_code: keyCode,
        type: genType,
        duration_months: parseInt(genDuration, 10),
        created_by: user?.id,
        promo_discount: genPromo ? parseInt(genPromoDiscount) || 0 : 0,
      });
      if (error) throw error;
      // Capture current UI state to avoid stale closures in onSuccess
      const now = new Date();
      const year = now.getFullYear();
      const capturedDur = parseInt(genDuration, 10) || 6;
      return {
        keyCode,
        action,
        capturedUser: selectedUser,
        capturedPlanType: genType,
        capturedPlanLabel: TYPE_LABELS[genType] ?? genType,
        capturedDuration: capturedDur,
        capturedDateDebut: toLocaleFR(now),
        capturedDateFin: toLocaleFR(addMonths(now, capturedDur)),
        capturedPrix: prixFinal,
        capturedPrixNormal: prixNormal,
        capturedRemisePct: remisePct,
        capturedRemiseMontant: remiseMontant,
        capturedOffert: genOffert,
        capturedPayMethod: genPayMethod,
        capturedPayRef: genPayRef,
        capturedInvoiceNum: `LIC-DIG-${year}-${String((licenseKeys?.length ?? 0) + 1).padStart(4, "0")}`,
      };
    },
    onSuccess: async ({ keyCode, action, capturedUser, capturedPlanType, capturedPlanLabel, capturedDuration, capturedDateDebut, capturedDateFin, capturedPrix, capturedPrixNormal, capturedRemisePct, capturedRemiseMontant, capturedOffert, capturedPayMethod, capturedPayRef, capturedInvoiceNum }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-license-keys"] });
      setGeneratedKey(keyCode);

      const planLabel = capturedPlanLabel ?? (TYPE_LABELS[capturedPlanType] ?? capturedPlanType);
      const today = new Date();

      if (action === "send" && capturedUser) {
        const expDate = addMonths(today, capturedDuration);
        const emailHtml = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:Arial,sans-serif;">
<table width="100%" bgcolor="#FAF7F4" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 20px;">
<table width="580" cellpadding="0" cellspacing="0" style="border-radius:16px;overflow:hidden;">
  <tr>
    <td bgcolor="#111111" style="padding:32px 40px 0;">
      <img src="${DIGAL_LOGO_B64}" alt="Digal" height="36" style="display:block;max-width:200px;">
    </td>
  </tr>
  <tr>
    <td bgcolor="#111111" height="3" style="padding:0;">
      <div style="height:3px;background:#E8511A;"></div>
    </td>
  </tr>
  <tr>
    <td bgcolor="#111111" style="padding:32px 40px 40px;color:white;">
      <p style="font-size:16px;margin:0 0 20px;">Bonjour <strong>${capturedUser.prenom}</strong>,</p>
      <p style="font-size:14px;color:rgba(255,255,255,0.65);margin:0 0 28px;line-height:1.6;">
        Votre licence <strong style="color:#E8511A;">${planLabel}</strong> (${capturedDuration} mois) est activée.
      </p>
      <table width="100%" bgcolor="#1a1a1a" style="border-radius:10px;margin:0 0 28px;">
        <tr><td style="padding:18px 22px;">
          <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;">Clé de licence</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#E8511A;letter-spacing:0.05em;">${keyCode}</p>
        </td></tr>
      </table>
      <table width="100%" style="margin:0 0 28px;border-top:1px solid rgba(255,255,255,0.08);">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:rgba(255,255,255,0.45);">Plan</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:white;text-align:right;">${planLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:rgba(255,255,255,0.45);">Durée</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:white;text-align:right;">${capturedDuration} mois</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:12px;color:rgba(255,255,255,0.45);">Expire le</td>
          <td style="padding:10px 0;font-size:12px;color:white;text-align:right;">${toLocaleFR(expDate)}</td>
        </tr>
      </table>
      <table width="100%">
        <tr><td align="center">
          <a href="https://digal.sn/dashboard/parametres" style="display:inline-block;background:#E8511A;color:white;text-decoration:none;padding:13px 30px;border-radius:100px;font-weight:600;font-size:14px;">Activer ma licence →</a>
        </td></tr>
      </table>
      <p style="margin:28px 0 0;font-size:11px;color:rgba(255,255,255,0.25);text-align:center;line-height:1.6;">
        Paramètres → Licence → Coller la clé<br>La facture PDF est en pièce jointe.
      </p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#0a0a0a" align="center" style="padding:18px 40px;">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">© 2026 Digal · <a href="https://digal.sn" style="color:#E8511A;text-decoration:none;">digal.sn</a></p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;

        // Generate PDF (try/catch isolated)
        let pdfBase64 = "";
        try {
          const doc = new jsPDF();
          const year = today.getFullYear();
          const num = capturedInvoiceNum.split("-").pop() ?? "0001";

          // Fond crème
          doc.setFillColor(250, 247, 244);
          doc.rect(0, 0, 210, 297, "F");

          // Bande noire header
          doc.setFillColor(17, 17, 17);
          doc.rect(0, 0, 210, 45, "F");

          // Logo PNG hardcodé en base64
          doc.addImage(DIGAL_LOGO_B64, "PNG", 14, 8, 60, 28);

          // FACTURE DE LICENCE à droite
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.text("FACTURE DE LICENCE", 196, 18, { align: "right" });
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(180, 180, 180);
          doc.text(`N° LIC-DIG-${year}-${num}`, 196, 26, { align: "right" });
          doc.text(capturedDateDebut, 196, 33, { align: "right" });

          // Ligne orange sous le header
          doc.setFillColor(232, 81, 26);
          doc.rect(0, 45, 210, 3, "F");

          // FACTURÉ À
          doc.setTextColor(107, 101, 96);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("FACTURÉ À", 14, 60);
          doc.setTextColor(17, 17, 17);
          doc.setFontSize(13);
          doc.text(`${capturedUser.prenom} ${capturedUser.nom}`, 14, 70);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(107, 101, 96);
          doc.text(capturedUser.email, 14, 78);

          // Ligne séparatrice orange
          doc.setDrawColor(232, 81, 26);
          doc.setLineWidth(0.3);
          doc.line(14, 86, 196, 86);

          // PRESTATION
          doc.setTextColor(107, 101, 96);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("PRESTATION", 14, 96);
          doc.setTextColor(17, 17, 17);
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.text(`Licence Digal ${planLabel} — ${capturedDuration} mois`, 14, 106);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(107, 101, 96);
          doc.text(`Du ${capturedDateDebut} au ${capturedDateFin}`, 14, 114);

          // Ligne séparatrice grise
          doc.setDrawColor(220, 215, 210);
          doc.line(14, 122, 196, 122);

          // PRIX (dynamique selon remise)
          let yPrice = 132;
          if (capturedRemisePct > 0) {
            doc.setFontSize(10);
            doc.setTextColor(107, 101, 96);
            doc.setFont("helvetica", "normal");
            doc.text("Prix normal", 14, yPrice);
            doc.text(`${capturedPrixNormal.toLocaleString("fr-FR")} FCFA`, 196, yPrice, { align: "right" });
            yPrice += 10;
            doc.setTextColor(232, 81, 26);
            doc.text(`Remise ${capturedRemisePct}%`, 14, yPrice);
            doc.text(`- ${capturedRemiseMontant.toLocaleString("fr-FR")} FCFA`, 196, yPrice, { align: "right" });
            yPrice += 10;
          }

          // Total
          doc.setFillColor(17, 17, 17);
          doc.rect(14, yPrice, 182, 16, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("TOTAL", 24, yPrice + 10);
          const montantText = capturedOffert
            ? "Offert"
            : `${(Number(capturedPrix) || 0).toLocaleString("fr-FR")} FCFA`;
          doc.text(montantText, 192, yPrice + 10, { align: "right" });
          yPrice += 26;

          // Méthode et référence paiement
          if (!capturedOffert) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(107, 101, 96);
            doc.text(`Méthode : ${capturedPayMethod || "—"}`, 14, yPrice);
            if (capturedPayRef) {
              doc.text(`Référence : ${capturedPayRef}`, 14, yPrice + 8);
              yPrice += 8;
            }
            yPrice += 14;
          }

          // CLÉ DE LICENCE
          doc.setFillColor(255, 243, 238);
          doc.rect(14, yPrice, 182, 22, "F");
          doc.setDrawColor(232, 81, 26);
          doc.setLineWidth(0.3);
          doc.rect(14, yPrice, 182, 22, "S");
          doc.setTextColor(107, 101, 96);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.text("CLÉ DE LICENCE", 22, yPrice + 8);
          doc.setTextColor(232, 81, 26);
          doc.setFontSize(14);
          doc.text(keyCode, 22, yPrice + 17);

          // Footer
          doc.setFillColor(17, 17, 17);
          doc.rect(0, 275, 210, 22, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text("Digal · digal.sn · noreply@digal.sn", 105, 287, { align: "center" });

          pdfBase64 = doc.output("datauristring").split(",")[1];
          console.log("[Licence] PDF généré, base64 length:", pdfBase64?.length ?? 0);
        } catch (pdfErr) {
          console.error("[Licence] Erreur génération PDF:", pdfErr);
        }

        // Try with PDF first, fallback to simple email
        console.log("[Licence] Envoi email à:", capturedUser.email);
        const { data: invokeData, error: invokeError } = await supabase.functions.invoke("send-email", {
          body: {
            type: "marketing",
            to: capturedUser.email,
            subject: `Votre licence Digal ${planLabel} est prête !`,
            html: emailHtml,
            ...(pdfBase64 ? { attachments: [{ content: pdfBase64, name: `licence-digal-${keyCode}.pdf` }] } : {}),
          },
        });
        console.log("[Licence] Résultat invoke:", { invokeData, invokeError });

        if (invokeError) {
          // Fallback : simple email without PDF
          console.warn("[Licence] Échec email (avec PDF), tentative sans pièce jointe :", invokeError.message);
          const { error: fallbackError } = await supabase.functions.invoke("send-email", {
            body: { type: "marketing", to: capturedUser.email, subject: `Votre licence Digal ${planLabel} est prête !`, html: emailHtml },
          });
          if (fallbackError) {
            toast.error(`Erreur Brevo : ${invokeError.message}`);
          } else {
            toast.success("Email envoyé — pièce jointe indisponible.");
          }
        } else {
          toast.success("Licence envoyée par email !");
        }
      } else {
        toast.success("Clé copiée !");
      }

      // Insert owner_payments entry (si utilisateur sélectionné)
      if (capturedUser) {
        const { error: insertError } = await supabase.from("owner_payments").insert({
          compte_nom: `${capturedUser.prenom} ${capturedUser.nom}`,
          compte_email: capturedUser.email,
          user_id: capturedUser.user_id ?? null,
          plan: capturedPlanType,
          montant: capturedOffert ? 0 : (Number(capturedPrix) || 0),
          methode: capturedOffert ? "offert" : capturedPayMethod || "autre",
          date_paiement: today.toISOString().slice(0, 10),
          statut: "paye",
        });
        if (insertError) {
          console.error("[Licence] owner_payments insert error:", insertError);
        } else {
          console.log("[Licence] owner_payments insert OK");
        }
      }

      copyToClipboard(keyCode).catch(() => {/* silent */});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    onError: () => toast.error("Erreur lors de la génération"),
  });

  const handleClickGenerate = () => {
    if (selectedUser) {
      setShowSendDialog(true);
    } else {
      generateKey.mutate("copy");
    }
  };

  const extendLicenseMutation = useMutation({
    mutationFn: async ({ userId, months }: { userId: string; months: number }) => {
      const { data: u, error: eErr } = await supabase.from("users").select("licence_expiration").eq("id", userId).single();
      if (eErr) throw eErr;
      const base = u?.licence_expiration ? new Date(u.licence_expiration) : new Date();
      const newExp = new Date(base);
      newExp.setMonth(newExp.getMonth() + months);
      const { error } = await supabase.from("users").update({ licence_expiration: newExp.toISOString() }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-licences-users"] });
      toast.success("Licence prolongée");
      setExtendUser(null);
    },
    onError: () => toast.error("Erreur lors de la prolongation"),
  });

  const handleCopy = () => {
    copyToClipboard(generatedKey).catch(() => {/* silent */});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGenerate = () => {
    setGeneratedKey("");
    setCopied(false);
    setGenPromo(false);
    setGenPromoDiscount("30");
    setGenOffert(false);
    setGenPayMethod("");
    setGenPayRef("");
    setSelectedUser(null);
    setSearchQuery("");
    setShowGenerate(true);
  };

  const exportCsv = () => {
    if (!licensedUsers.length) return;
    const header = "Nom,Email,Plan,Expiration\n";
    const rows = licensedUsers.map(u =>
      `"${u.prenom} ${u.nom}","${u.email}","${u.role}","${u.licence_expiration ? new Date(u.licence_expiration).toLocaleDateString("fr-FR") : "-"}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `licences-digal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Licences</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
            <Button variant="outline" size="sm" onClick={handleOpenGenerate}><Key className="h-4 w-4 mr-1" /> Générer clé</Button>
            <Button size="sm" onClick={() => setShowActivate(true)}><Plus className="h-4 w-4 mr-1" /> Activer licence</Button>
          </div>
        </div>

        {/* Licensed users */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : usersError ? (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-destructive font-sans">
              <AlertCircle className="h-4 w-4 shrink-0" /> Erreur de chargement des comptes
            </div>
            <button onClick={() => refetchUsers()} className="text-xs underline text-destructive">Réessayer</button>
          </div>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">Comptes sous licence</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licensedUsers.map((u) => {
                    const expired = u.licence_expiration && new Date(u.licence_expiration) < new Date();
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.prenom} {u.nom}</TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                        <TableCell>
                          {expired
                            ? <Badge className="bg-destructive/10 text-destructive">Expiré</Badge>
                            : <Badge className="bg-success/10 text-success">Actif</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.licence_expiration ? new Date(u.licence_expiration).toLocaleDateString("fr-FR") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => { setExtendUser({ id: u.id, email: u.email, licence_expiration: u.licence_expiration }); setExtendMonths("3"); }}
                              >
                                <CalendarPlus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Prolonger la licence</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {licensedUsers.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Aucune licence active</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Generated keys */}
        {!keysLoading && (
          <Card>
            <CardHeader><CardTitle className="text-base">Clés de licence générées</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clé</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Utilisée le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(licenseKeys ?? []).map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-mono text-xs">{k.key_code}</TableCell>
                      <TableCell><Badge variant="outline">{TYPE_LABELS[k.type] ?? k.type}</Badge></TableCell>
                      <TableCell className="text-sm">{k.duration_months} mois</TableCell>
                      <TableCell>
                        {k.is_used
                          ? <Badge className="bg-slate-100 text-slate-700">Utilisée</Badge>
                          : <Badge className="bg-success/10 text-success">Disponible</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {k.used_at ? new Date(k.used_at).toLocaleDateString("fr-FR") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(licenseKeys ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune clé générée</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ── Generate key dialog ─────────────────────────────────────────── */}
        <Dialog open={showGenerate} onOpenChange={(v) => { setShowGenerate(v); if (!v) { setGeneratedKey(""); setSelectedUser(null); setSearchQuery(""); } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Générer une clé de licence</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6">
              {/* ── Left: form ── */}
              <div className="space-y-4">
                {/* User search */}
                <div>
                  <Label>Utilisateur (optionnel)</Label>
                  {selectedUser ? (
                    <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {(selectedUser.prenom[0] ?? "") + (selectedUser.nom[0] ?? "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{selectedUser.prenom} {selectedUser.nom}</p>
                        <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{PLAN_LABEL[selectedUser.role] ?? selectedUser.role}</Badge>
                          {selectedUser.licence_expiration && (
                            <span className="text-[10px] text-muted-foreground">
                              exp. {new Date(selectedUser.licence_expiration).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={handleClearUser} className="shrink-0 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative mt-1.5">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        className="pl-8"
                        placeholder="Rechercher un utilisateur…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                        disabled={!!generatedKey}
                      />
                      {searchLoading && (
                        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {searchOpen && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                          {searchResults.map(u => (
                            <button
                              key={u.id}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent text-left transition-colors"
                              onClick={() => handleSelectUser(u)}
                            >
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                                  {(u.prenom[0] ?? "") + (u.nom[0] ?? "")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{u.prenom} {u.nom}</p>
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                              </div>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{PLAN_LABEL[u.role] ?? u.role}</Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Type */}
                <div>
                  <Label>Type de licence</Label>
                  <Select value={genType} onValueChange={setGenType} disabled={!!generatedKey}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">CM Pro</SelectItem>
                      <SelectItem value="agence_standard">Studio</SelectItem>
                      <SelectItem value="agence_pro">Elite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration — saisie libre */}
                <div>
                  <Label>Durée (mois)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    placeholder="Ex: 2"
                    value={String(genDuration)}
                    onChange={e => setGenDuration(e.target.value)}
                    disabled={!!generatedKey}
                  />
                  {prixFinal > 0 && !genOffert && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total : {prixFinal.toLocaleString("fr-FR")} FCFA
                      {(remisePct > 0 || promoPercent > 0) && ` (remise incluse)`}
                    </p>
                  )}
                </div>

                {/* Offert toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Licence offerte</p>
                    <p className="text-xs text-muted-foreground">Montant affiché à 0 FCFA</p>
                  </div>
                  <Switch checked={genOffert} onCheckedChange={setGenOffert} disabled={!!generatedKey} />
                </div>

                {/* Promo key */}
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Clé promotionnelle</p>
                      <p className="text-xs text-muted-foreground">Réduction sur le prix affiché</p>
                    </div>
                  </div>
                  <Switch checked={genPromo} onCheckedChange={setGenPromo} disabled={!!generatedKey} />
                </div>
                {genPromo && !generatedKey && (
                  <div>
                    <Label>Réduction (%)</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input type="number" value={genPromoDiscount} onChange={e => setGenPromoDiscount(e.target.value)} min="1" max="100" className="w-24" />
                      <span className="text-xs text-muted-foreground">Ex : 30 = -30%</span>
                    </div>
                  </div>
                )}

                {/* Payment info — masqué si licence offerte */}
                {!generatedKey && !genOffert && (
                  <>
                    <div>
                      <Label>Mode de paiement</Label>
                      <Input placeholder="Wave, Orange Money, virement…" value={String(genPayMethod)} onChange={e => setGenPayMethod(e.target.value)} />
                    </div>
                    <div>
                      <Label>Référence paiement</Label>
                      <Input placeholder="Ex : OM-20260430-XXXX" value={String(genPayRef)} onChange={e => setGenPayRef(e.target.value)} />
                    </div>
                  </>
                )}

                {/* Generated key display */}
                {generatedKey && (
                  <div className="rounded-lg bg-muted p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-sm font-semibold">{generatedKey}</span>
                      {genPromo && <Badge className="ml-2 bg-primary/10 text-primary text-[10px]">-{genPromoDiscount}%</Badge>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>

              {/* ── Right: invoice preview ── */}
              <div>
                <Label className="mb-2 block">Aperçu facture</Label>
                <div className="rounded-lg border border-border bg-white overflow-hidden" style={{ minHeight: 340 }}>
                  <div className="p-5">
                    <LicenceInvoicePreview
                      invoiceNum={invoiceNum}
                      user={selectedUser}
                      planType={genType}
                      durationMonths={dur}
                      prixNormal={prixNormal}
                      remisePct={remisePct}
                      remiseMontant={remiseMontant}
                      promoPercent={promoPercent}
                      remisePromo={remisePromo}
                      prixFinal={prixFinal}
                      offert={genOffert}
                      payMethod={genOffert ? "" : genPayMethod}
                      payRef={genOffert ? "" : genPayRef}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowGenerate(false); setGeneratedKey(""); setSelectedUser(null); setSearchQuery(""); }}>Fermer</Button>
              {!generatedKey && (
                <Button onClick={handleClickGenerate} disabled={generateKey.isPending}>
                  {generateKey.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Générer
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Extend license dialog ──────────────────────────────────────────── */}
        <Dialog open={!!extendUser} onOpenChange={(v) => !v && setExtendUser(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prolonger la licence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-sans">{extendUser?.email}</p>
              {extendUser?.licence_expiration && (
                <p className="text-xs text-muted-foreground font-sans">
                  Expiration actuelle : {new Date(extendUser.licence_expiration).toLocaleDateString("fr-FR")}
                </p>
              )}
              <div>
                <Label>Durée à ajouter (mois)</Label>
                <Input type="number" value={extendMonths} onChange={e => setExtendMonths(e.target.value)} min="1" max="24" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExtendUser(null)}>Annuler</Button>
              <Button
                onClick={() => extendUser && extendLicenseMutation.mutate({ userId: extendUser.id, months: parseInt(extendMonths) || 3 })}
                disabled={extendLicenseMutation.isPending}
              >
                {extendLicenseMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Prolonger
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Activate existing user dialog ──────────────────────────────────── */}
        <Dialog open={showActivate} onOpenChange={setShowActivate}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Activer une licence manuellement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Compte</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un compte" /></SelectTrigger>
                  <SelectContent>
                    {users?.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo_standard">CM Pro</SelectItem>
                    <SelectItem value="agence_standard">Studio</SelectItem>
                    <SelectItem value="agence_pro">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durée (mois)</Label>
                <Input type="number" value={duree} onChange={e => setDuree(e.target.value)} min="1" max="24" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActivate(false)}>Annuler</Button>
              <Button onClick={() => activateLicense.mutate()} disabled={!selectedUserId || activateLicense.isPending}>
                {activateLicense.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Activer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* ── Confirmation dialog ──────────────────────────────────────────── */}
        <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Envoyer par email ?</AlertDialogTitle>
              <AlertDialogDescription>
                La clé et la facture seront envoyées à <strong>{selectedUser?.email}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => { setShowSendDialog(false); generateKey.mutate("copy"); }}
                disabled={generateKey.isPending}
              >
                <Copy className="h-4 w-4 mr-1.5" /> Juste copier
              </Button>
              <Button
                onClick={() => { setShowSendDialog(false); generateKey.mutate("send"); }}
                disabled={generateKey.isPending}
              >
                {generateKey.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />} Envoyer + copier
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AdminLayout>
  );
}
