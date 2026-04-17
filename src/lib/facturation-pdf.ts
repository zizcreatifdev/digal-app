import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Document, DocumentLine, Payment } from "./facturation";
import { formatFCFA, METHODE_LABELS, STATUT_LABELS } from "./facturation";

export interface PdfUserProfile {
  prenom: string;
  nom: string;
  email: string;
  agence_nom?: string | null;
  telephone?: string | null;
  ninea?: string | null;
  logo_url?: string | null;
  tampon_url?: string | null;
  signature_url?: string | null;
}

export interface PdfClientInfo {
  nom: string;
  contact_nom?: string | null;
  contact_email?: string | null;
  contact_telephone?: string | null;
  facturation_adresse?: string | null;
}

// ─── Image helpers ────────────────────────────────────────────────
async function loadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

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

// ─── Color palette ────────────────────────────────────────────────
const C_ORANGE: [number, number, number] = [232, 81, 26];   // #E8511A
const C_DARK: [number, number, number]   = [26, 26, 26];    // #1a1a1a
const C_GRAY: [number, number, number]   = [107, 114, 128]; // #6b7280
const C_BORDER: [number, number, number] = [229, 231, 235]; // #e5e7eb
const C_THEAD: [number, number, number]  = [249, 250, 251]; // #f9fafb
const C_GREEN: [number, number, number]  = [22, 163, 74];   // #16a34a

function getStatusBadgeColors(statut: string): {
  bg: [number, number, number];
  text: [number, number, number];
} {
  switch (statut) {
    case "paye":               return { bg: [220, 252, 231], text: [21, 128, 61] };
    case "en_retard":          return { bg: [254, 226, 226], text: [185, 28, 28] };
    case "envoye":             return { bg: [219, 234, 254], text: [29, 78, 216] };
    case "partiellement_paye": return { bg: [254, 243, 199], text: [146, 64, 14] };
    default:                   return { bg: [243, 244, 246], text: [107, 114, 128] };
  }
}

// ─── Main export ─────────────────────────────────────────────────
export async function generateDocumentPdf(
  doc: Document,
  lines: DocumentLine[],
  payments: Payment[],
  clientInfo: PdfClientInfo,
  userProfile: PdfUserProfile
) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ML = 15;
  const MR = 15;
  const isFacture = doc.type === "facture";
  const title = isFacture ? "FACTURE" : "DEVIS";

  // ── Load all images in parallel ─────────────────────────────────
  const [digalIconData, tamponData, signatureData, userLogoData] =
    await Promise.all([
      loadSvgAsPng("/logos/Logo%20Digal-icon_orange_sansbaseline.svg", 100, 100),
      userProfile.tampon_url ? loadImage(userProfile.tampon_url) : Promise.resolve(null),
      userProfile.signature_url ? loadImage(userProfile.signature_url) : Promise.resolve(null),
      userProfile.logo_url ? loadImage(userProfile.logo_url) : Promise.resolve(null),
    ]);

  // ══════════════════════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════════════════════

  // Left: CM / Agency branding
  let headerLeftY = 14;

  if (userLogoData) {
    try { pdf.addImage(userLogoData, "PNG", ML, headerLeftY, 30, 15); headerLeftY += 19; }
    catch { /* skip logo, show name only */ }
  }

  const displayName = userProfile.agence_nom || `${userProfile.prenom} ${userProfile.nom}`;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(userLogoData ? 10 : 12);
  pdf.setTextColor(...C_DARK);
  pdf.text(displayName, ML, headerLeftY);
  headerLeftY += 5.5;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...C_GRAY);
  if (userProfile.telephone) { pdf.text(userProfile.telephone, ML, headerLeftY); headerLeftY += 4.5; }
  pdf.text(userProfile.email, ML, headerLeftY); headerLeftY += 4.5;
  if (userProfile.ninea) { pdf.text(`NINEA : ${userProfile.ninea}`, ML, headerLeftY); }

  // Right: document type label (uppercase gray small)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C_GRAY);
  pdf.text(title, pageW - MR, 15, { align: "right" });

  // Number (16pt bold)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...C_DARK);
  pdf.text(doc.numero, pageW - MR, 25, { align: "right" });

  // Status badge (rounded rect)
  const badgeLabel = STATUT_LABELS[doc.statut] ?? doc.statut;
  const { bg: badgeBg, text: badgeTextColor } = getStatusBadgeColors(doc.statut);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  const badgeTextW = pdf.getStringUnitWidth(badgeLabel) * 8 / pdf.internal.scaleFactor;
  const bPadX = 3;
  const bPadY = 1.5;
  const bH = 5.5;
  const bW = badgeTextW + bPadX * 2;
  const bX = pageW - MR - bW;
  const bY = 30;
  pdf.setFillColor(...badgeBg);
  pdf.roundedRect(bX, bY, bW, bH, 1.2, 1.2, "F");
  pdf.setTextColor(...badgeTextColor);
  pdf.text(badgeLabel, pageW - MR - bPadX, bY + bH - bPadY, { align: "right" });

  // ── Separator ───────────────────────────────────────────────────
  let y = 52;
  pdf.setDrawColor(...C_BORDER);
  pdf.setLineWidth(0.3);
  pdf.line(ML, y, pageW - MR, y);
  y += 8;

  // ══════════════════════════════════════════════════════════════════
  // INFO SECTION — 2 columns
  // ══════════════════════════════════════════════════════════════════
  const col2X = pageW / 2 + 10;
  const infoStartY = y;

  // LEFT — "Facturé à"
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C_GRAY);
  pdf.text("FACTURÉ À", ML, y);
  y += 6;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C_DARK);
  pdf.text(clientInfo.nom, ML, y);
  y += 5.5;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...C_GRAY);
  if (clientInfo.contact_nom) { pdf.text(clientInfo.contact_nom, ML, y); y += 4.5; }
  if (clientInfo.contact_email) { pdf.text(clientInfo.contact_email, ML, y); y += 4.5; }
  if (clientInfo.contact_telephone) { pdf.text(clientInfo.contact_telephone, ML, y); y += 4.5; }
  if (clientInfo.facturation_adresse) {
    const wrapped = pdf.splitTextToSize(clientInfo.facturation_adresse, col2X - ML - 5) as string[];
    pdf.text(wrapped, ML, y);
    y += wrapped.length * 4.5;
  }

  // RIGHT — "Détails"
  let ry = infoStartY;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C_GRAY);
  pdf.text("DÉTAILS", col2X, ry);
  ry += 6;

  const detailRows: [string, string][] = [
    ["Date de création", doc.date_emission],
    ...(doc.date_echeance ? [["Date d'échéance", doc.date_echeance] as [string, string]] : []),
    ...(doc.methodes_paiement.length > 0
      ? [["Méthode de paiement", doc.methodes_paiement.map((m) => METHODE_LABELS[m] ?? m).join(", ")] as [string, string]]
      : []),
  ];

  detailRows.forEach(([label, value]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C_GRAY);
    pdf.text(label, col2X, ry);
    ry += 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C_DARK);
    pdf.text(String(value), col2X, ry);
    ry += 5.5;
  });

  y = Math.max(y, ry) + 10;

  // ══════════════════════════════════════════════════════════════════
  // PRESTATIONS TABLE
  // ══════════════════════════════════════════════════════════════════
  const hasDiscount = Number(doc.remise_pct) > 0 && Number(doc.montant_remise) > 0;
  const discountRowIdx = lines.length; // 0-based index of discount row in body

  const tableBody: string[][] = [
    ...lines.map((l) => [
      l.description,
      String(l.quantite),
      formatFCFA(l.prix_unitaire),
      formatFCFA(l.quantite * l.prix_unitaire),
    ]),
    ...(hasDiscount
      ? [[`Remise ${doc.remise_pct}%`, "", "", `- ${formatFCFA(doc.montant_remise)}`]]
      : []),
  ];

  autoTable(pdf, {
    startY: y,
    head: [["DESCRIPTION", "QTÉ", "PRIX UNIT.", "MONTANT"]],
    body: tableBody,
    headStyles: {
      fillColor: C_THEAD,
      textColor: C_GRAY,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: C_DARK,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: [255, 255, 255] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: "auto", fontStyle: "bold" },
      1: { halign: "center", cellWidth: 16 },
      2: { halign: "right", cellWidth: 40 },
      3: { halign: "right", cellWidth: 40 },
    },
    margin: { left: ML, right: MR },
    theme: "plain",
    styles: {
      lineColor: C_BORDER,
      lineWidth: 0.3,
    },
    tableLineColor: C_BORDER,
    tableLineWidth: 0.3,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (hasDiscount && data.section === "body" && data.row.index === discountRowIdx) {
        data.cell.styles.textColor = C_GREEN;
        data.cell.styles.fontStyle = "bold";
      }
    },
    didDrawPage: () => {},
  });

  // ══════════════════════════════════════════════════════════════════
  // TOTALS (right-aligned)
  // ══════════════════════════════════════════════════════════════════
  const tableEndY = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30;
  let ty = tableEndY + 10;

  const totalsLabelX = pageW - MR - 80;
  const totalsValueX = pageW - MR;

  // Helper draws one totals row
  const drawRow = (label: string, value: string, color: [number, number, number], bold: boolean, size: number) => {
    pdf.setFontSize(size);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setTextColor(...C_GRAY);
    pdf.text(label, totalsLabelX, ty);
    pdf.setTextColor(...color);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.text(value, totalsValueX, ty, { align: "right" });
    ty += size > 10 ? 7 : 6;
  };

  drawRow("Sous-total", formatFCFA(doc.sous_total), C_DARK, false, 9);

  if (hasDiscount) {
    drawRow(
      `Remise (${doc.remise_pct}%)`,
      `- ${formatFCFA(doc.montant_remise)}`,
      C_GREEN,
      false,
      9,
    );
  }

  if (Number(doc.montant_brs) > 0) {
    drawRow(`BRS (${doc.taux_brs}%)`, formatFCFA(doc.montant_brs), C_DARK, false, 9);
  }

  if (Number(doc.taux_tva) > 0) {
    drawRow(`TVA (${doc.taux_tva}%)`, formatFCFA(doc.montant_tva), C_DARK, false, 9);
  }

  // Thin separator
  ty += 1;
  pdf.setDrawColor(...C_BORDER);
  pdf.setLineWidth(0.4);
  pdf.line(totalsLabelX, ty, totalsValueX, ty);
  ty += 5;

  // TOTAL — bold, 12pt
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...C_DARK);
  pdf.text("TOTAL", totalsLabelX, ty);
  pdf.text(formatFCFA(doc.total), totalsValueX, ty, { align: "right" });
  ty += 12;

  // ══════════════════════════════════════════════════════════════════
  // PAYMENTS (invoices only)
  // ══════════════════════════════════════════════════════════════════
  if (isFacture && payments.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C_GRAY);
    pdf.text("PAIEMENTS REÇUS", ML, ty);
    ty += 6;

    autoTable(pdf, {
      startY: ty,
      head: [["DATE", "MONTANT", "MÉTHODE", "NOTES"]],
      body: payments.map((p) => [
        p.date_paiement,
        formatFCFA(p.montant),
        METHODE_LABELS[p.methode] ?? p.methode,
        p.notes ?? "",
      ]),
      headStyles: {
        fillColor: C_THEAD,
        textColor: C_GRAY,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: { fontSize: 9, textColor: C_DARK, cellPadding: 3 },
      margin: { left: ML, right: MR },
      theme: "plain",
      styles: { lineColor: C_BORDER, lineWidth: 0.3 },
    });

    const totalPaid = payments.reduce((s, p) => s + p.montant, 0);
    const solde = doc.total - totalPaid;
    const payFinalY = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? ty + 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    if (solde > 0) {
      pdf.setTextColor(...C_ORANGE);
      pdf.text(`Solde restant : ${formatFCFA(solde)}`, pageW - MR, payFinalY + 8, { align: "right" });
    } else {
      pdf.setTextColor(...C_GREEN);
      pdf.text("✓ Intégralement payé", pageW - MR, payFinalY + 8, { align: "right" });
    }
    ty = payFinalY + 16;
  }

  // ══════════════════════════════════════════════════════════════════
  // NOTES
  // ══════════════════════════════════════════════════════════════════
  if (doc.notes && ty < pageH - 40) {
    pdf.setDrawColor(...C_BORDER);
    pdf.setLineWidth(0.3);
    pdf.line(ML, ty - 2, pageW - MR, ty - 2);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C_GRAY);
    pdf.text("NOTES & CONDITIONS", ML, ty + 4);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...C_DARK);
    pdf.text(doc.notes, ML, ty + 10, { maxWidth: pageW - 30 });
  }

  // ══════════════════════════════════════════════════════════════════
  // TAMPON + SIGNATURE
  // ══════════════════════════════════════════════════════════════════
  const stampZoneY = pageH - 58;

  if (signatureData) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C_GRAY);
    pdf.text("Signature", ML, stampZoneY);
    try { pdf.addImage(signatureData, "PNG", ML, stampZoneY + 3, 40, 20); } catch { /* skip */ }
  }

  if (tamponData) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C_GRAY);
    pdf.text("Cachet / Tampon", pageW - 55, stampZoneY);
    try { pdf.addImage(tamponData, "PNG", pageW - 55, stampZoneY + 3, 40, 20); } catch { /* skip */ }
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER — mention discrète centrée
  // ══════════════════════════════════════════════════════════════════
  pdf.setDrawColor(...C_BORDER);
  pdf.setLineWidth(0.3);
  pdf.line(ML, pageH - 18, pageW - MR, pageH - 18);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(190, 190, 190);

  const footerStr = "Propulsé par · digal.sn";
  const iconW = 4.5;
  const iconH = 4.5;
  const gap = 1.5;
  const tw = pdf.getStringUnitWidth(footerStr) * 7 / pdf.internal.scaleFactor;
  const totalW = iconW + gap + tw;
  const startX = (pageW - totalW) / 2;
  const iconY = pageH - 13.5;
  const textY = pageH - 10;

  if (digalIconData) {
    try { pdf.addImage(digalIconData, "PNG", startX, iconY, iconW, iconH); } catch { /* skip */ }
    pdf.text(footerStr, startX + iconW + gap, textY);
  } else {
    pdf.text(footerStr, pageW / 2, textY, { align: "center" });
  }

  return pdf;
}
