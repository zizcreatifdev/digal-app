import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { KpiReport, KpiMetriques, CumulativeStats, MonthlyKpiRow } from "./kpi-reports";
import { NETWORK_METRICS_CONFIG, getFilledMetrics } from "./kpi-reports";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function getMonthLabel(ym: string): string {
  // Cumulative: "depuis:2025-10-15"
  if (ym.startsWith("depuis:")) {
    const d = new Date(ym.slice(7));
    return `Depuis le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
  }
  // Quarterly: "2026-Q2"
  if (/^\d{4}-Q\d$/.test(ym)) {
    const [y, q] = ym.split("-Q").map(Number);
    const quarters = ["janv – mars", "avr – juin", "juil – sept", "oct – déc"];
    return `T${q} ${y} (${quarters[q - 1] ?? ""})`;
  }
  // Custom range: "2026-01-01/2026-04-15"
  if (ym.includes("/")) {
    const [start, end] = ym.split("/");
    const fmt = (s: string) =>
      new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    return `${fmt(start)} — ${fmt(end)}`;
  }
  // Monthly: "2026-04"
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1);
  return d.toLocaleString("fr-FR", { month: "long", year: "numeric" });
}

const NETWORK_COLORS: Record<string, [number, number, number]> = {
  instagram: [228, 64, 95],
  facebook: [24, 119, 242],
  linkedin: [10, 102, 194],
  x: [29, 161, 242],
  tiktok: [0, 0, 0],
};

export async function generateKpiPdf(
  report: KpiReport,
  clientName: string,
  clientLogoUrl: string | null,
  cmName: string,
  previousReport?: KpiReport | null
) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const accent: [number, number, number] = [196, 82, 42];
  const dark: [number, number, number] = [26, 26, 26];
  const lightBg: [number, number, number] = [253, 248, 245];

  // ─── HEADER GRADIENT BAR ────────────────────────────────────
  pdf.setFillColor(...accent);
  pdf.rect(0, 0, pageW, 32, "F");
  // Subtle lighter overlay on right side
  pdf.setFillColor(212, 113, 74);
  pdf.rect(pageW / 2, 0, pageW / 2, 32, "F");

  // Client initial circle
  pdf.setFillColor(255, 255, 255, 0.2);
  pdf.circle(22, 16, 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(clientName.charAt(0).toUpperCase(), 22, 19, { align: "center" });

  // Client name
  pdf.setFontSize(15);
  pdf.text(clientName, 33, 14);

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("Rapport de performance", 33, 20);

  // CM name on right
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text(cmName, pageW - 15, 13, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  const monthLabel = getMonthLabel(report.mois);
  pdf.text(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), pageW - 15, 19, { align: "right" });

  // ─── CONTENT ────────────────────────────────────────────────
  let y = 42;
  const metriques = report.metriques as KpiMetriques;
  const prevMetriques = previousReport?.metriques as KpiMetriques | undefined;

  for (const [netKey, config] of Object.entries(NETWORK_METRICS_CONFIG)) {
    const netData = metriques[netKey as keyof KpiMetriques];
    const filled = getFilledMetrics(netData);
    if (filled.length === 0) continue;

    if (y > 240) {
      pdf.addPage();
      y = 20;
    }

    const netColor = NETWORK_COLORS[netKey] ?? accent;

    // Network icon circle + label
    pdf.setFillColor(netColor[0], netColor[1], netColor[2], 0.1);
    pdf.circle(20, y - 1, 4, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...netColor);
    // Network initial letter in circle
    pdf.text(config.label.charAt(0), 20, y + 0.5, { align: "center" });

    pdf.setFontSize(11);
    pdf.text(config.label, 27, y + 1);
    y += 6;

    const prevNet = prevMetriques?.[netKey as keyof KpiMetriques];

    const tableBody = filled.map((m) => {
      const row = [m.label, formatNumber(m.value)];
      if (prevNet) {
        const prevVal = prevNet[m.key];
        if (prevVal !== undefined && prevVal !== 0) {
          const diff = m.value - (prevVal as number);
          const pct = Math.round((diff / (prevVal as number)) * 100);
          row.push(`${pct > 0 ? "+" : ""}${pct}%`);
        } else {
          row.push("-");
        }
      }
      return row;
    });

    const head = prevNet ? [["Métrique", "Valeur", "Évolution"]] : [["Métrique", "Valeur"]];

    autoTable(pdf, {
      startY: y,
      head,
      body: tableBody,
      headStyles: {
        fillColor: netColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        cellPadding: 3,
      },
      bodyStyles: { fontSize: 8.5, textColor: dark, cellPadding: 3 },
      alternateRowStyles: { fillColor: lightBg },
      margin: { left: 15, right: 15 },
      theme: "grid",
      styles: { lineWidth: 0.1, lineColor: [230, 220, 210] },
      didParseCell: (data) => {
        // Color evolution column
        if (data.section === "body" && data.column.index === 2) {
          const text = String(data.cell.raw ?? "");
          if (text.startsWith("+")) {
            data.cell.styles.textColor = [16, 185, 129]; // emerald
          } else if (text.startsWith("-")) {
            data.cell.styles.textColor = [239, 68, 68]; // red
          }
        }
      },
    });

    y = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY + 12 || y + 30;
  }

  // ─── TEXT SECTIONS ──────────────────────────────────────────
  const textSections = [
    { title: "Points forts du mois", content: report.points_forts },
    { title: "Axes d'amélioration", content: report.axes_amelioration },
    { title: "Objectifs mois prochain", content: report.objectifs },
  ];

  for (const section of textSections) {
    if (!section.content?.trim()) continue;

    if (y > 250) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...accent);
    pdf.text(section.title, 15, y);
    y += 5;

    // Light background box
    const lines = pdf.splitTextToSize(section.content, pageW - 34);
    const boxH = lines.length * 4.5 + 6;
    pdf.setFillColor(...lightBg);
    pdf.roundedRect(15, y - 3, pageW - 30, boxH, 3, 3, "F");

    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...dark);
    pdf.text(lines, 17, y + 1);
    y += boxH + 8;
  }

  // ─── FOOTER ─────────────────────────────────────────────────
  // Pre-load Digal logo for footer
  let digalLogoPng: string | null = null;
  try {
    const response = await fetch("/logos/Logo%20Digal-iconorange_avec_baseline_noir.svg");
    const svgText = await response.text();
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);
    digalLogoPng = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200; canvas.height = 96;
        canvas.getContext("2d")?.drawImage(img, 0, 0, 200, 96);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    });
  } catch { /* silent fail: use text fallback */ }

  const addFooter = (p: jsPDF) => {
    const fY = pageH - 10;
    p.setFontSize(7);
    p.setTextColor(180, 180, 180);
    p.text(`Rapport généré par ${cmName} via Digal`, 15, fY);
    if (digalLogoPng) {
      try {
        p.addImage(digalLogoPng, "PNG", pageW - 35, fY - 7, 20, 9.6);
      } catch {
        p.text("digal.sn", pageW - 23, fY);
      }
    } else {
      p.setFillColor(...accent);
      p.roundedRect(pageW - 30, fY - 4, 5, 5, 1, 1, "F");
      p.setFontSize(5);
      p.setTextColor(255, 255, 255);
      p.text("D", pageW - 27.5, fY - 0.5, { align: "center" });
      p.setTextColor(180, 180, 180);
      p.setFontSize(7);
      p.text("digal.sn", pageW - 23, fY);
    }
  };

  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    addFooter(pdf);
  }

  return pdf;
}

export async function generateCumulativeKpiPdf(
  report: KpiReport,
  clientName: string,
  clientLogoUrl: string | null,
  cmName: string,
  stats: CumulativeStats,
  monthly: MonthlyKpiRow[]
) {
  // ─── PRE-LOAD CLIENT LOGO ───────────────────────────────────
  let clientLogoPng: string | null = null;
  if (clientLogoUrl) {
    try {
      const resp = await fetch(clientLogoUrl);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      clientLogoPng = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 96; canvas.height = 96;
          const ctx = canvas.getContext("2d");
          if (ctx) { ctx.clearRect(0, 0, 96, 96); ctx.drawImage(img, 0, 0, 96, 96); }
          URL.revokeObjectURL(objectUrl);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
        img.src = objectUrl;
      });
    } catch { /* silent fail — fall back to initials */ }
  }

  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const accent: [number, number, number] = [196, 82, 42];
  const dark: [number, number, number] = [26, 26, 26];
  const lightBg: [number, number, number] = [253, 248, 245];

  // ─── HEADER ─────────────────────────────────────────────────
  pdf.setFillColor(...accent);
  pdf.rect(0, 0, pageW, 32, "F");
  pdf.setFillColor(212, 113, 74);
  pdf.rect(pageW / 2, 0, pageW / 2, 32, "F");

  // Client logo or initial
  pdf.setFillColor(255, 255, 255);
  pdf.circle(22, 16, 8, "F");
  if (clientLogoPng) {
    try { pdf.addImage(clientLogoPng, "PNG", 14, 8, 16, 16); } catch { /* fall back to initials */ }
  }
  if (!clientLogoPng) {
    pdf.setTextColor(accent[0], accent[1], accent[2]);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(clientName.charAt(0).toUpperCase(), 22, 19, { align: "center" });
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(15);
  pdf.text(clientName, 33, 14);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("Rapport de performance · Depuis le début", 33, 20);

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text(cmName, pageW - 15, 13, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  const startLabel = new Date(stats.date_debut).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  pdf.text(`Depuis ${startLabel}`, pageW - 15, 19, { align: "right" });

  // ─── STATS SUMMARY ──────────────────────────────────────────
  let y = 42;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...accent);
  pdf.text("Statistiques cumulées", 15, y);
  y += 7;

  const statCards = [
    { label: "Durée de collaboration", value: `${stats.nb_mois} mois` },
    { label: "Posts publiés", value: String(stats.total_posts_publies) },
    { label: "Taux d'approbation", value: `${stats.taux_approbation}%` },
    { label: "Liens de validation", value: String(stats.total_liens) },
    { label: "Moy. posts / mois", value: String(stats.moyenne_posts_par_mois) },
    { label: "Meilleur mois", value: stats.meilleur_mois ?? "—" },
  ];

  const cardW = (pageW - 40) / 3;
  const cardH = 20;
  const gapX = 5;
  const gapY = 5;

  statCards.forEach((card, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 15 + col * (cardW + gapX);
    const cy = y + row * (cardH + gapY);
    pdf.setFillColor(...lightBg);
    pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(120, 120, 120);
    pdf.text(card.label, cx + 4, cy + 6);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...dark);
    pdf.text(card.value, cx + 4, cy + 14);
  });

  y += 2 * (cardH + gapY) + 4;

  if (stats.temps_moyen_validation_h !== null) {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Temps moyen de validation client : ${stats.temps_moyen_validation_h}h`, 15, y);
    y += 10;
  } else {
    y += 4;
  }

  // ─── MONTHLY TABLES BY NETWORK ──────────────────────────────
  const sortedMonthly = [...monthly].sort((a, b) => a.mois.localeCompare(b.mois));

  for (const [netKey, config] of Object.entries(NETWORK_METRICS_CONFIG)) {
    const hasData = sortedMonthly.some((row) => {
      const netData = row.data[netKey as keyof KpiMetriques];
      return netData && Object.values(netData).some((v) => v !== undefined && v !== null);
    });
    if (!hasData) continue;

    if (y > 220) { pdf.addPage(); y = 20; }

    const netColor = NETWORK_COLORS[netKey] ?? accent;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(netColor[0], netColor[1], netColor[2]);
    pdf.text(config.label, 15, y);
    y += 5;

    const activeFields = config.fields.filter((f) =>
      sortedMonthly.some((row) => {
        const netData = row.data[netKey as keyof KpiMetriques];
        return netData && netData[f.key] !== undefined && netData[f.key] !== null;
      })
    );
    if (activeFields.length === 0) continue;

    const head = [["Mois", ...activeFields.map((f) => f.label)]];
    const body: (string)[][] = sortedMonthly.map((row) => {
      const netData = row.data[netKey as keyof KpiMetriques];
      return [
        getMonthLabel(row.mois),
        ...activeFields.map((f) => {
          const v = netData?.[f.key];
          return v !== undefined && v !== null ? formatNumber(v) : "—";
        }),
      ];
    });

    if (sortedMonthly.length >= 2) {
      const firstNet = sortedMonthly[0].data[netKey as keyof KpiMetriques];
      const lastNet = sortedMonthly[sortedMonthly.length - 1].data[netKey as keyof KpiMetriques];
      const growthRow: string[] = [
        "Croissance",
        ...activeFields.map((f) => {
          const first = firstNet?.[f.key];
          const last = lastNet?.[f.key];
          if (first && last && first !== 0) {
            const pct = Math.round(((last - first) / first) * 100);
            return `${pct > 0 ? "+" : ""}${pct}%`;
          }
          return "—";
        }),
      ];
      body.push(growthRow);
    }

    autoTable(pdf, {
      startY: y,
      head,
      body,
      headStyles: { fillColor: netColor, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold", cellPadding: 3 },
      bodyStyles: { fontSize: 8, textColor: dark, cellPadding: 3 },
      alternateRowStyles: { fillColor: lightBg },
      margin: { left: 15, right: 15 },
      theme: "grid",
      styles: { lineWidth: 0.1, lineColor: [230, 220, 210] },
      didParseCell: (data) => {
        if (data.section === "body" && data.row.index === body.length - 1 && sortedMonthly.length >= 2) {
          data.cell.styles.fontStyle = "bold";
          if (data.column.index > 0) {
            const text = String(data.cell.raw ?? "");
            if (text.startsWith("+")) data.cell.styles.textColor = [16, 185, 129];
            else if (text.startsWith("-")) data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
    });

    y = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY + 12 || y + 30;
  }

  // ─── TEXT SECTIONS ──────────────────────────────────────────
  for (const section of [
    { title: "Points forts", content: report.points_forts },
    { title: "Axes d'amélioration", content: report.axes_amelioration },
    { title: "Objectifs", content: report.objectifs },
  ]) {
    if (!section.content?.trim()) continue;
    if (y > 250) { pdf.addPage(); y = 20; }

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...accent);
    pdf.text(section.title, 15, y);
    y += 5;

    const lines = pdf.splitTextToSize(section.content, pageW - 34);
    const boxH = lines.length * 4.5 + 6;
    pdf.setFillColor(...lightBg);
    pdf.roundedRect(15, y - 3, pageW - 30, boxH, 3, 3, "F");
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...dark);
    pdf.text(lines, 17, y + 1);
    y += boxH + 8;
  }

  // ─── FOOTER ─────────────────────────────────────────────────
  let digalLogoPng: string | null = null;
  try {
    const response = await fetch("/logos/Logo%20Digal-iconorange_avec_baseline_noir.svg");
    const svgText = await response.text();
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);
    digalLogoPng = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200; canvas.height = 96;
        canvas.getContext("2d")?.drawImage(img, 0, 0, 200, 96);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    });
  } catch { /* silent fail */ }

  const addFooter = (p: jsPDF) => {
    const fY = pageH - 10;
    p.setFontSize(7);
    p.setTextColor(180, 180, 180);
    p.text(`Rapport généré par ${cmName} via Digal`, 15, fY);
    if (digalLogoPng) {
      try { p.addImage(digalLogoPng, "PNG", pageW - 35, fY - 7, 20, 9.6); }
      catch { p.text("digal.sn", pageW - 23, fY); }
    } else {
      p.setFillColor(...accent);
      p.roundedRect(pageW - 30, fY - 4, 5, 5, 1, 1, "F");
      p.setFontSize(5);
      p.setTextColor(255, 255, 255);
      p.text("D", pageW - 27.5, fY - 0.5, { align: "center" });
      p.setTextColor(180, 180, 180);
      p.setFontSize(7);
      p.text("digal.sn", pageW - 23, fY);
    }
  };

  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) { pdf.setPage(i); addFooter(pdf); }

  return pdf;
}
