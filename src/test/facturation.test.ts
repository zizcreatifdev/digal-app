import { describe, it, expect, vi } from "vitest";

// Mock Supabase client: the module imports it at top level
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn(), onAuthStateChange: vi.fn() },
  },
}));

import { calculateTotals, formatFCFA } from "@/lib/facturation";
import type { DocumentLine } from "@/lib/facturation";

// Helper to build a DocumentLine
function line(
  description: string,
  quantite: number,
  prix_unitaire: number,
  brs_applicable: boolean
): DocumentLine {
  return {
    description,
    quantite,
    prix_unitaire,
    brs_applicable,
    montant: quantite * prix_unitaire,
    ordre: 0,
  };
}

// ─── calculateTotals ────────────────────────────────────────────────────────

describe("calculateTotals", () => {
  it("calcule correctement avec BRS 1% et TVA 18%", () => {
    const lines = [line("Prestation", 1, 100_000, true)];
    const { sousTotal, montantBrs, montantTva, total } = calculateTotals(lines, 1, 18);

    expect(sousTotal).toBe(100_000);
    expect(montantBrs).toBe(1_000); // 100 000 * 1%
    // TVA sur (sousTotal + BRS) = 101 000 * 18% = 18 180
    expect(montantTva).toBe(18_180);
    expect(total).toBe(119_180);
  });

  it("n'applique pas BRS sur les lignes non-BRS", () => {
    const lines = [line("Prestation", 1, 100_000, false)];
    const { sousTotal, montantBrs, montantTva, total } = calculateTotals(lines, 1, 18);

    expect(sousTotal).toBe(100_000);
    expect(montantBrs).toBe(0); // Pas de BRS car brs_applicable=false
    expect(montantTva).toBe(18_000); // 100 000 * 18%
    expect(total).toBe(118_000);
  });

  it("gère une liste de lignes vide", () => {
    const { sousTotal, montantBrs, montantTva, total } = calculateTotals([], 1, 18);

    expect(sousTotal).toBe(0);
    expect(montantBrs).toBe(0);
    expect(montantTva).toBe(0);
    expect(total).toBe(0);
  });

  it("applique BRS uniquement sur les lignes concernées (mix)", () => {
    const lines = [
      line("Création contenu", 2, 50_000, true),  // BRS applicable → 100 000
      line("Abonnement outil", 1, 30_000, false),  // Pas de BRS
    ];
    const { sousTotal, montantBrs, montantTva, total } = calculateTotals(lines, 1, 0);

    expect(sousTotal).toBe(130_000); // 100 000 + 30 000
    expect(montantBrs).toBe(1_000); // 100 000 * 1% = 1 000
    expect(montantTva).toBe(0); // TVA 0%
    expect(total).toBe(131_000);
  });

  it("gère TVA 0% (pas de TVA)", () => {
    const lines = [line("Forfait", 1, 50_000, true)];
    const { montantTva, total } = calculateTotals(lines, 1, 0);

    expect(montantTva).toBe(0);
    expect(total).toBe(50_000 + 500); // sousTotal + BRS (1%)
  });

  it("gère BRS 0% (pas de BRS)", () => {
    const lines = [line("Forfait", 1, 50_000, true)];
    const { montantBrs, total } = calculateTotals(lines, 0, 18);

    expect(montantBrs).toBe(0);
    expect(total).toBe(50_000 + 9_000); // sousTotal + TVA 18%
  });

  it("utilise Math.round pour les arrondis", () => {
    // BRS sur 33 333 à 1% = 333.33 → arrondi à 333
    const lines = [line("Prestation", 1, 33_333, true)];
    const { montantBrs } = calculateTotals(lines, 1, 0);

    expect(montantBrs).toBe(333);
    expect(Number.isInteger(montantBrs)).toBe(true);
  });

  it("multiplie quantité × prix unitaire pour le sous-total", () => {
    const lines = [line("Posts Instagram", 5, 15_000, false)];
    const { sousTotal } = calculateTotals(lines, 0, 0);

    expect(sousTotal).toBe(75_000);
  });
});

// ─── formatFCFA ─────────────────────────────────────────────────────────────

describe("formatFCFA", () => {
  // Normalize non-breaking spaces used by fr-SN locale
  function normalize(s: string) {
    return s.replace(/\u00a0|\u202f/g, " ");
  }

  it("formate 150 000 FCFA correctement", () => {
    expect(normalize(formatFCFA(150_000))).toBe("150 000 FCFA");
  });

  it("formate 0 FCFA", () => {
    expect(normalize(formatFCFA(0))).toBe("0 FCFA");
  });

  it("formate 1 000 000 FCFA", () => {
    expect(normalize(formatFCFA(1_000_000))).toBe("1 000 000 FCFA");
  });

  it("formate les montants < 1000 sans séparateur", () => {
    expect(normalize(formatFCFA(500))).toBe("500 FCFA");
  });

  it("se termine toujours par ' FCFA'", () => {
    expect(formatFCFA(12_345)).toMatch(/FCFA$/);
  });

  it("ne contient pas de décimales", () => {
    expect(formatFCFA(1_234)).not.toContain(",");
    expect(formatFCFA(1_234)).not.toContain(".");
  });
});
