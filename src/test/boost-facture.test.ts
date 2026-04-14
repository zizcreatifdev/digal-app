import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn(), onAuthStateChange: vi.fn() },
  },
}));

import { fetchBoostDepenses, markBoostIncluded } from "@/lib/comptabilite";
import { supabase } from "@/integrations/supabase/client";

// ─── Mock data ────────────────────────────────────────────────────────────────

const boostDepenses = [
  {
    id: "dep-1",
    user_id: "user-1",
    client_id: "client-1",
    categorie: "publicite",
    montant: 50000,
    description: "Boost Instagram",
    date_depense: "2026-04-01",
    inclure_facture: false,
    reseau: "instagram",
    created_at: "2026-04-01T10:00:00Z",
  },
  {
    id: "dep-2",
    user_id: "user-1",
    client_id: "client-1",
    categorie: "publicite",
    montant: 30000,
    description: "Boost Facebook",
    date_depense: "2026-04-05",
    inclure_facture: false,
    reseau: "facebook",
    created_at: "2026-04-05T10:00:00Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── fetchBoostDepenses ───────────────────────────────────────────────────────

describe("fetchBoostDepenses", () => {
  it("retourne les dépenses publicité non incluses dans un document", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: boostDepenses, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);

    const result = await fetchBoostDepenses("user-1", "client-1");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("dep-1");
    expect(result[1].id).toBe("dep-2");
  });

  it("filtre par user_id et client_id", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);

    await fetchBoostDepenses("user-2", "client-5");

    // Verify that .eq was called with the right arguments
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-2");
    expect(chain.eq).toHaveBeenCalledWith("client_id", "client-5");
    expect(chain.eq).toHaveBeenCalledWith("categorie", "publicite");
    expect(chain.eq).toHaveBeenCalledWith("inclure_facture", false);
  });

  it("retourne tableau vide si aucune dépense", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);

    const result = await fetchBoostDepenses("user-1", "client-1");
    expect(result).toEqual([]);
  });

  it("throw en cas d'erreur Supabase", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    };
    vi.mocked(supabase.from).mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);

    await expect(fetchBoostDepenses("user-1", "client-1")).rejects.toThrow();
  });
});

// ─── markBoostIncluded ───────────────────────────────────────────────────────

describe("markBoostIncluded", () => {
  it("met à jour inclure_facture=true pour la dépense", async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);

    await markBoostIncluded("dep-1");

    expect(chain.update).toHaveBeenCalledWith({ inclure_facture: true });
    expect(chain.eq).toHaveBeenCalledWith("id", "dep-1");
  });

  it("throw en cas d'erreur Supabase", async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: new Error("Update failed") }),
    };
    vi.mocked(supabase.from).mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);

    await expect(markBoostIncluded("dep-bad")).rejects.toThrow();
  });
});

// ─── Boost → ligne facture (génération) ──────────────────────────────────────
// The actual line generation happens inline in the UI (Facturation.tsx)
// Here we test the business logic transformation

describe("boost → ligne facture (transformation)", () => {
  function boostToDocumentLine(dep: { description: string; montant: number }) {
    return {
      description: dep.description,
      quantite: 1,
      prix_unitaire: dep.montant,
      brs_applicable: false,
      montant: dep.montant,
      ordre: 0,
    };
  }

  it("convertit une dépense boost en ligne avec brs_applicable=false", () => {
    const line = boostToDocumentLine({ description: "Boost Instagram", montant: 50000 });
    expect(line.brs_applicable).toBe(false);
    expect(line.montant).toBe(50000);
    expect(line.quantite).toBe(1);
  });

  it("préserve la description de la dépense", () => {
    const line = boostToDocumentLine({ description: "Campagne Facebook Ads", montant: 75000 });
    expect(line.description).toBe("Campagne Facebook Ads");
  });

  it("convertit plusieurs boosts en plusieurs lignes", () => {
    const deps = [
      { description: "Boost 1", montant: 10000 },
      { description: "Boost 2", montant: 20000 },
    ];
    const lines = deps.map(boostToDocumentLine);
    expect(lines).toHaveLength(2);
    expect(lines[0].prix_unitaire).toBe(10000);
    expect(lines[1].prix_unitaire).toBe(20000);
  });

  it("le total des boosts est la somme des montants", () => {
    const deps = [
      { description: "Boost A", montant: 25000 },
      { description: "Boost B", montant: 35000 },
    ];
    const total = deps.reduce((sum, d) => sum + d.montant, 0);
    expect(total).toBe(60000);
  });
});
