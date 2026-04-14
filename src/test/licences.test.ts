import { describe, it, expect } from "vitest";

// ─── Key format validation ───────────────────────────────────────────────────
// Keys follow the pattern: DIGAL-<TYPE>-<6 chars alphanumeric uppercase>
// Types: SOLO, STD (agence_standard), PRO (agence_pro)

const KEY_REGEX = /^DIGAL-(SOLO|STD|PRO)-[A-Z0-9]{6}$/;

function validateKeyFormat(key: string): boolean {
  return KEY_REGEX.test(key);
}

const TYPE_SHORT: Record<string, string> = {
  solo: "SOLO",
  agence_standard: "STD",
  agence_pro: "PRO",
};

function generateKeyCode(type: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DIGAL-${TYPE_SHORT[type] ?? "SOLO"}-${suffix}`;
}

// Cumulative extension: adds months to current expiry if still valid,
// or months to now if already expired
function computeNewExpiry(currentExpiry: string | null, addMonths: number): Date {
  const base = currentExpiry && new Date(currentExpiry) > new Date()
    ? new Date(currentExpiry)
    : new Date();
  const result = new Date(base);
  result.setMonth(result.getMonth() + addMonths);
  return result;
}

// ─── Key format ──────────────────────────────────────────────────────────────

describe("validateKeyFormat", () => {
  it("accepte un key SOLO valide", () => {
    expect(validateKeyFormat("DIGAL-SOLO-AB12CD")).toBe(true);
  });

  it("accepte un key STD valide", () => {
    expect(validateKeyFormat("DIGAL-STD-XY9876")).toBe(true);
  });

  it("accepte un key PRO valide", () => {
    expect(validateKeyFormat("DIGAL-PRO-000000")).toBe(true);
  });

  it("rejette un key sans prefixe DIGAL", () => {
    expect(validateKeyFormat("SOLO-AB12CD")).toBe(false);
  });

  it("rejette un key avec type invalide", () => {
    expect(validateKeyFormat("DIGAL-AGENCE-AB12CD")).toBe(false);
  });

  it("rejette un key avec suffix trop court", () => {
    expect(validateKeyFormat("DIGAL-SOLO-ABCD")).toBe(false);
  });

  it("rejette un key avec suffix trop long", () => {
    expect(validateKeyFormat("DIGAL-SOLO-ABCDEFG")).toBe(false);
  });

  it("rejette un key avec caracteres minuscules", () => {
    expect(validateKeyFormat("DIGAL-SOLO-abc123")).toBe(false);
  });

  it("rejette une chaine vide", () => {
    expect(validateKeyFormat("")).toBe(false);
  });
});

// ─── Key generation ──────────────────────────────────────────────────────────

describe("generateKeyCode", () => {
  it("génère un format valide pour type solo", () => {
    const key = generateKeyCode("solo");
    expect(validateKeyFormat(key)).toBe(true);
    expect(key.startsWith("DIGAL-SOLO-")).toBe(true);
  });

  it("génère un format valide pour type agence_standard", () => {
    const key = generateKeyCode("agence_standard");
    expect(validateKeyFormat(key)).toBe(true);
    expect(key.startsWith("DIGAL-STD-")).toBe(true);
  });

  it("génère un format valide pour type agence_pro", () => {
    const key = generateKeyCode("agence_pro");
    expect(validateKeyFormat(key)).toBe(true);
    expect(key.startsWith("DIGAL-PRO-")).toBe(true);
  });

  it("génère des clés uniques à chaque appel", () => {
    const keys = Array.from({ length: 10 }, () => generateKeyCode("solo"));
    const unique = new Set(keys);
    // Very unlikely all 10 would be the same
    expect(unique.size).toBeGreaterThan(1);
  });

  it("utilise SOLO par défaut pour un type inconnu", () => {
    const key = generateKeyCode("unknown_type");
    expect(key.startsWith("DIGAL-SOLO-")).toBe(true);
  });
});

// ─── Cumulative extension ────────────────────────────────────────────────────

describe("computeNewExpiry", () => {
  it("étend depuis la date d'expiration actuelle si toujours valide", () => {
    const future = new Date();
    future.setMonth(future.getMonth() + 3);
    const result = computeNewExpiry(future.toISOString(), 3);

    const expected = new Date(future);
    expected.setMonth(expected.getMonth() + 3);
    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
  });

  it("étend depuis maintenant si la licence est expirée", () => {
    const past = new Date("2020-01-01T00:00:00Z");
    const result = computeNewExpiry(past.toISOString(), 6);

    const expected = new Date();
    expected.setMonth(expected.getMonth() + 6);
    // Allow 5-second tolerance for test execution time
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(5000);
  });

  it("étend depuis maintenant si expiry est null", () => {
    const result = computeNewExpiry(null, 6);
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 6);
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(5000);
  });

  it("cumule correctement deux extensions successives", () => {
    const base = new Date();
    base.setMonth(base.getMonth() + 6);

    // First extension: +3 months on top of 6 months from now
    const after1 = computeNewExpiry(base.toISOString(), 3);
    // Second extension: +3 months on top of 9 months
    const after2 = computeNewExpiry(after1.toISOString(), 3);

    const expected = new Date(base);
    expected.setMonth(expected.getMonth() + 6); // 6+3+3 = 12 months
    expect(after2.getFullYear()).toBe(expected.getFullYear());
    expect(after2.getMonth()).toBe(expected.getMonth());
  });
});
