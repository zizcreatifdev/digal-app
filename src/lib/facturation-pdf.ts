import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Document, DocumentLine, Payment } from "./facturation";
import { formatFCFA, METHODE_LABELS, STATUT_LABELS } from "./facturation";

export interface PdfUserProfile {
  prenom: string;
  nom: string;
  email: string;
  agence_nom?: string | null;
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
  const isFacture = doc.type === "facture";
  const title = isFacture ? "FACTURE" : "DEVIS";

  // Colors
  const accent: [number, number, number] = [196, 82, 42];
  const dark: [number, number, number] = [26, 26, 26];
  const gray: [number, number, number] = [120, 120, 120];
  const lightBg: [number, number, number] = [250, 247, 244];

  // === HEADER ===
  // Accent top bar
  pdf.setFillColor(...accent);
  pdf.rect(0, 0, pageW, 3, "F");

  // Try to load user logo
  let logoLoaded = false;
  if (userProfile.logo_url) {
    const logoData = await loadImage(userProfile.logo_url);
    if (logoData) {
      try {
        pdf.addImage(logoData, "PNG", 15, 10, 30, 30);
        logoLoaded = true;
      } catch {
        // fallback to text
      }
    }
  }

  // Emitter info (left side)
  const emitterX = logoLoaded ? 50 : 15;
  let ey = 14;
  pdf.setTextColor(...dark);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(userProfile.agence_nom || `${userProfile.prenom} ${userProfile.nom}`, emitterX, ey);
  ey += 6;
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...gray);
  if (userProfile.agence_nom) {
    pdf.text(`${userProfile.prenom} ${userProfile.nom}`, emitterX, ey);
    ey += 4.5;
  }
  pdf.text(userProfile.email, emitterX, ey);

  // Document title (right side)
  pdf.setTextColor(...accent);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, pageW - 15, 16, { align: "right" });

  pdf.setTextColor(...dark);
  pdf.setFontSize(11);
  pdf.text(doc.numero, pageW - 15, 23, { align: "right" });

  // Separator
  let y = 45;
  pdf.setDrawColor(230, 225, 220);
  pdf.setLineWidth(0.5);
  pdf.line(15, y, pageW - 15, y);
  y += 10;

  // === META + CLIENT INFO ===
  // Left column: document details
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...gray);
  pdf.text("INFORMATIONS", 15, y);
  y += 6;

  pdf.setFontSize(9);
  pdf.setTextColor(...dark);
  pdf.setFont("helvetica", "normal");

  const metaItems = [
    ["Date d'émission", doc.date_emission],
    ...(doc.date_echeance ? [["Date d'échéance", doc.date_echeance]] : []),
    ["Statut", STATUT_LABELS[doc.statut] ?? doc.statut],
  ];
  if (doc.methodes_paiement.length > 0) {
    metaItems.push(["Paiement", doc.methodes_paiement.map((m) => METHODE_LABELS[m] ?? m).join(", ")]);
  }

  metaItems.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label} :`, 15, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(value), 55, y);
    y += 5.5;
  });

  // Right column: client info
  const clientX = pageW / 2 + 15;
  let cy = y - metaItems.length * 5.5; // align with meta start

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...gray);
  pdf.text("FACTURER À", clientX, cy);
  cy += 6;

  // Client box background
  const clientBoxH = 28;
  pdf.setFillColor(...lightBg);
  pdf.roundedRect(clientX - 3, cy - 4, pageW - clientX - 12, clientBoxH, 2, 2, "F");

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...dark);
  pdf.text(clientInfo.nom, clientX, cy);
  cy += 5.5;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...gray);
  if (clientInfo.contact_nom) {
    pdf.text(clientInfo.contact_nom, clientX, cy);
    cy += 4.5;
  }
  if (clientInfo.contact_email) {
    pdf.text(clientInfo.contact_email, clientX, cy);
    cy += 4.5;
  }
  if (clientInfo.contact_telephone) {
    pdf.text(`Tél : ${clientInfo.contact_telephone}`, clientX, cy);
    cy += 4.5;
  }
  if (clientInfo.facturation_adresse) {
    pdf.text(clientInfo.facturation_adresse, clientX, cy, { maxWidth: pageW - clientX - 15 });
  }

  y = Math.max(y, cy) + 12;

  // === PRESTATIONS TABLE ===
  autoTable(pdf, {
    startY: y,
    head: [["Description", "Qté", "Prix unitaire", "BRS", "Montant"]],
    body: lines.map((l) => [
      l.description,
      String(l.quantite),
      formatFCFA(l.prix_unitaire),
      l.brs_applicable ? "Oui" : "—",
      formatFCFA(l.quantite * l.prix_unitaire),
    ]),
    headStyles: {
      fillColor: accent,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: dark,
      cellPadding: 4,
    },
    alternateRowStyles: { fillColor: [250, 247, 244] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 18 },
      2: { halign: "right", cellWidth: 35 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "right", cellWidth: 35 },
    },
    margin: { left: 15, right: 15 },
    theme: "plain",
    styles: {
      lineColor: [230, 225, 220],
      lineWidth: 0.3,
    },
    didDrawPage: () => {},
  });

  // === TOTALS ===
  const tableEndY = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30;
  let ty = tableEndY + 8;

  const totalsStartX = pageW / 2 + 20;
  const totalsEndX = pageW - 15;

  // Background for totals
  const totalsItems = [
    { label: "Sous-total", value: formatFCFA(doc.sous_total), bold: false },
    { label: `BRS (${doc.taux_brs}%)`, value: formatFCFA(doc.montant_brs), bold: false },
  ];
  if (Number(doc.taux_tva) > 0) {
    totalsItems.push({ label: `TVA (${doc.taux_tva}%)`, value: formatFCFA(doc.montant_tva), bold: false });
  }

  pdf.setFontSize(9);
  totalsItems.forEach((item) => {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...gray);
    pdf.text(item.label, totalsStartX, ty);
    pdf.setTextColor(...dark);
    pdf.text(item.value, totalsEndX, ty, { align: "right" });
    ty += 6;
  });

  // Total line
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.8);
  pdf.line(totalsStartX, ty - 1, totalsEndX, ty - 1);
  ty += 5;

  // Total amount
  pdf.setFillColor(...accent);
  pdf.roundedRect(totalsStartX - 3, ty - 5, totalsEndX - totalsStartX + 6, 10, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text("TOTAL", totalsStartX, ty);
  pdf.text(formatFCFA(doc.total), totalsEndX, ty, { align: "right" });

  ty += 14;

  // === PAYMENTS (for invoices) ===
  if (isFacture && payments.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...dark);
    pdf.text("Paiements reçus", 15, ty);
    ty += 6;

    autoTable(pdf, {
      startY: ty,
      head: [["Date", "Montant", "Méthode", "Notes"]],
      body: payments.map((p) => [
        p.date_paiement,
        formatFCFA(p.montant),
        METHODE_LABELS[p.methode] ?? p.methode,
        p.notes ?? "",
      ]),
      headStyles: {
        fillColor: dark,
        textColor: [255, 255, 255],
        fontSize: 9,
        cellPadding: 3,
      },
      bodyStyles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 15, right: 15 },
      theme: "plain",
      styles: { lineColor: [230, 225, 220], lineWidth: 0.3 },
    });

    const totalPaid = payments.reduce((s, p) => s + p.montant, 0);
    const solde = doc.total - totalPaid;
    const payFinalY = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? ty + 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    if (solde > 0) {
      pdf.setTextColor(196, 82, 42);
      pdf.text(`Solde restant : ${formatFCFA(solde)}`, pageW - 15, payFinalY + 8, { align: "right" });
    } else {
      pdf.setTextColor(22, 163, 74);
      pdf.text("✓ Intégralement payé", pageW - 15, payFinalY + 8, { align: "right" });
    }
  }

  // === NOTES ===
  if (doc.notes) {
    const notesY = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable.finalY + 18
      : ty + 6;

    if (notesY < pageH - 30) {
      pdf.setDrawColor(230, 225, 220);
      pdf.setLineWidth(0.3);
      pdf.line(15, notesY - 4, pageW - 15, notesY - 4);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...gray);
      pdf.text("NOTES & CONDITIONS", 15, notesY);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...dark);
      pdf.text(doc.notes, 15, notesY + 5, { maxWidth: pageW - 30 });
    }
  }

  // === TAMPON + SIGNATURE ===
  const stampZoneY = pageH - 60; // Fixed zone above footer

  const loadStampOrSig = async (url: string | null | undefined): Promise<string | null> => {
    if (!url) return null;
    return loadImage(url);
  };

  const [tamponsData, signatureData] = await Promise.all([
    loadStampOrSig(userProfile.tampon_url),
    loadStampOrSig(userProfile.signature_url),
  ]);

  if (signatureData || tamponsData) {
    // Signature line label (left)
    if (signatureData) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...gray);
      pdf.text("Signature", 15, stampZoneY);
      try {
        pdf.addImage(signatureData, "PNG", 15, stampZoneY + 3, 40, 20);
      } catch { /* skip if image format unsupported */ }
    }

    // Tampon (right side)
    if (tamponsData) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...gray);
      pdf.text("Cachet / Tampon", pageW - 55, stampZoneY);
      try {
        pdf.addImage(tamponsData, "PNG", pageW - 55, stampZoneY + 3, 40, 20);
      } catch { /* skip if image format unsupported */ }
    }
  }

  // === FOOTER ===
  pdf.setDrawColor(230, 225, 220);
  pdf.setLineWidth(0.3);
  pdf.line(15, pageH - 18, pageW - 15, pageH - 18);

  pdf.setFontSize(7.5);
  pdf.setTextColor(...gray);
  pdf.setFont("helvetica", "normal");
  const footerName = userProfile.agence_nom || `${userProfile.prenom} ${userProfile.nom}`;
  pdf.text(footerName, 15, pageH - 12);
  pdf.text(userProfile.email, 15, pageH - 8);

  // Digal logo in footer
  const digalLogoData = await loadSvgAsPng(
    "/logos/Logo%20Digal-iconorange_avec_baseline_noir.svg",
    200, 96
  );
  if (digalLogoData) {
    try {
      pdf.addImage(digalLogoData, "PNG", pageW - 35, pageH - 16, 20, 9.6);
    } catch {
      pdf.setTextColor(180, 180, 180);
      pdf.text("Généré avec Digal", pageW - 15, pageH - 10, { align: "right" });
    }
  } else {
    pdf.setTextColor(180, 180, 180);
    pdf.text("Généré avec Digal", pageW - 15, pageH - 10, { align: "right" });
  }

  // Bottom accent bar
  pdf.setFillColor(...accent);
  pdf.rect(0, pageH - 3, pageW, 3, "F");

  return pdf;
}
