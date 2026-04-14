import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn(), onAuthStateChange: vi.fn() },
  },
}));

import { generateNumero } from "@/lib/facturation";
import { supabase } from "@/integrations/supabase/client";

// ─── Mock builder ─────────────────────────────────────────────────────────────
// generateNumero makes two queries:
//   1. site_settings → .select().eq().maybeSingle() → { data: { value: sigle } }
//   2. documents     → .select().eq().eq().like()   → { count: N }

function mockGenerateNumero(sigle: string | null, docCount: number) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === "site_settings") {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: sigle !== null ? { value: sigle } : null,
          error: null,
        }),
      };
      return chain as unknown as ReturnType<typeof supabase.from>;
    }

    if (table === "documents") {
      // Chain: .select().eq().eq().like() → resolves with count
      const docChain: Record<string, unknown> = {};
      docChain.eq = vi.fn().mockReturnValue(docChain);
      docChain.like = vi.fn().mockResolvedValue({ count: docCount, error: null });
      return {
        select: vi.fn().mockReturnValue(docChain),
      } as unknown as ReturnType<typeof supabase.from>;
    }

    return {} as ReturnType<typeof supabase.from>;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Numérotation documents ───────────────────────────────────────────────────

describe("generateNumero", () => {
  const year = new Date().getFullYear();

  it("format DEV-SIGLE-YYYY-0001 avec sigle et premier document", async () => {
    mockGenerateNumero("LCS", 0);
    const num = await generateNumero("devis", "user-123");
    expect(num).toBe(`DEV-LCS-${year}-0001`);
  });

  it("format FAC-YYYY-0001 sans sigle", async () => {
    mockGenerateNumero(null, 0);
    const num = await generateNumero("facture", "user-123");
    expect(num).toBe(`FAC-${year}-0001`);
  });

  it("incrémente correctement — 5 existants → 0006", async () => {
    mockGenerateNumero("DIG", 5);
    const num = await generateNumero("devis", "user-456");
    expect(num).toBe(`DEV-DIG-${year}-0006`);
  });

  it("pad à 4 chiffres — 99 existants → 0100", async () => {
    mockGenerateNumero("AGC", 99);
    const num = await generateNumero("facture", "user-789");
    expect(num).toBe(`FAC-AGC-${year}-0100`);
  });

  it("le préfixe change selon le type (DEV vs FAC)", async () => {
    mockGenerateNumero("XYZ", 0);
    const devis = await generateNumero("devis", "user-1");
    expect(devis.startsWith("DEV-")).toBe(true);

    mockGenerateNumero("XYZ", 0);
    const facture = await generateNumero("facture", "user-1");
    expect(facture.startsWith("FAC-")).toBe(true);
  });

  it("le sigle est mis en majuscule", async () => {
    mockGenerateNumero("abc", 0); // lowercase input
    const num = await generateNumero("devis", "user-1");
    // The function calls .trim().toUpperCase()
    expect(num).toContain("ABC");
  });

  it("sigle vide → format sans sigle", async () => {
    mockGenerateNumero("", 0);
    const num = await generateNumero("devis", "user-1");
    expect(num).toBe(`DEV-${year}-0001`);
  });
});

// ─── Client slug ──────────────────────────────────────────────────────────────
// Pure function — no Supabase needed

import { slugifyClientName } from "@/lib/clients";

describe("slugifyClientName", () => {
  it("met en minuscule", () => {
    expect(slugifyClientName("ACME")).toBe("acme");
  });

  it("supprime les accents", () => {
    expect(slugifyClientName("Élodie & Compagnie")).toBe("elodie-compagnie");
  });

  it("remplace les espaces par des tirets", () => {
    expect(slugifyClientName("Mon Client")).toBe("mon-client");
  });

  it("collapse les tirets multiples", () => {
    expect(slugifyClientName("a  b--c")).toBe("a-b-c");
  });

  it("supprime les tirets en debut et fin", () => {
    expect(slugifyClientName("--test--")).toBe("test");
  });

  it("tronque à 40 caractères", () => {
    const long = "abcdefghijklmnopqrstuvwxyz0123456789extra";
    expect(slugifyClientName(long).length).toBeLessThanOrEqual(40);
  });
});
