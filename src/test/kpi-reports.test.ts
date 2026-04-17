import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn(), onAuthStateChange: vi.fn() },
  },
}));

import { hasMetrics, getFilledMetrics } from "@/lib/kpi-reports";
import type { KpiMetriques, NetworkMetrics } from "@/lib/kpi-reports";

// ─── hasMetrics ──────────────────────────────────────────────────────────────

describe("hasMetrics", () => {
  it("retourne false pour un objet vide", () => {
    expect(hasMetrics({})).toBe(false);
  });

  it("retourne false si le réseau est présent mais vide", () => {
    const metriques: KpiMetriques = { instagram: {} };
    expect(hasMetrics(metriques)).toBe(false);
  });

  it("retourne true si toutes les valeurs sont 0 (valeur saisie intentionnelle)", () => {
    const metriques: KpiMetriques = { instagram: { abonnes: 0, portee: 0 } };
    expect(hasMetrics(metriques)).toBe(true);
  });

  it("retourne false si toutes les valeurs sont undefined", () => {
    const metriques: KpiMetriques = {
      instagram: { abonnes: undefined },
      facebook: { fans: undefined },
    };
    expect(hasMetrics(metriques)).toBe(false);
  });

  it("retourne true si au moins une valeur > 0 existe", () => {
    const metriques: KpiMetriques = { instagram: { abonnes: 1_000 } };
    expect(hasMetrics(metriques)).toBe(true);
  });

  it("retourne true même si un seul réseau sur plusieurs a des données", () => {
    const metriques: KpiMetriques = {
      instagram: { abonnes: 500 },
      facebook: { fans: 0 },
    };
    expect(hasMetrics(metriques)).toBe(true);
  });

  it("retourne true pour plusieurs réseaux avec données", () => {
    const metriques: KpiMetriques = {
      instagram: { abonnes: 2_000, portee: 5_000 },
      facebook: { fans: 1_500 },
    };
    expect(hasMetrics(metriques)).toBe(true);
  });

  it("retourne false si le réseau existe mais la valeur est null (via cast)", () => {
    // NetworkMetrics values are number | undefined but JSON can have null
    const metriques: KpiMetriques = {
      instagram: { abonnes: null as unknown as number },
    };
    expect(hasMetrics(metriques)).toBe(false);
  });
});

// ─── getFilledMetrics ────────────────────────────────────────────────────────

describe("getFilledMetrics", () => {
  it("retourne [] si networkMetrics est undefined", () => {
    expect(getFilledMetrics(undefined)).toEqual([]);
  });

  it("retourne [] si networkMetrics est vide", () => {
    expect(getFilledMetrics({})).toEqual([]);
  });

  it("inclut les valeurs à 0 (valeur saisie intentionnelle)", () => {
    const metrics: NetworkMetrics = { abonnes: 0, portee: 1_000 };
    const result = getFilledMetrics(metrics);
    expect(result).toHaveLength(2);
    const portee = result.find((r) => r.key === "portee");
    const abonnes = result.find((r) => r.key === "abonnes");
    expect(portee?.value).toBe(1_000);
    expect(abonnes?.value).toBe(0);
  });

  it("filtre les valeurs undefined", () => {
    const metrics: NetworkMetrics = { abonnes: undefined, portee: 500 };
    const result = getFilledMetrics(metrics);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("portee");
  });

  it("mappe 'abonnes' sur le label 'Abonnés' (depuis config Instagram/X/TikTok)", () => {
    const metrics: NetworkMetrics = { abonnes: 1_000 };
    const result = getFilledMetrics(metrics);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("abonnes");
    expect(result[0].label).toBe("Abonnés");
    expect(result[0].value).toBe(1_000);
  });

  it("mappe 'fans' sur le label 'Fans' (depuis config Facebook)", () => {
    const metrics: NetworkMetrics = { fans: 2_500 };
    const result = getFilledMetrics(metrics);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Fans");
    expect(result[0].value).toBe(2_500);
  });

  it("mappe 'followers' sur le label 'Followers' (depuis config LinkedIn)", () => {
    const metrics: NetworkMetrics = { followers: 800 };
    const result = getFilledMetrics(metrics);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Followers");
  });

  it("utilise la clé comme label si inconnue dans la config", () => {
    const metrics: NetworkMetrics = { metric_inconnue: 42 };
    const result = getFilledMetrics(metrics);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("metric_inconnue");
    expect(result[0].label).toBe("metric_inconnue");
    expect(result[0].value).toBe(42);
  });

  it("retourne plusieurs métriques remplies dans l'ordre", () => {
    const metrics: NetworkMetrics = {
      abonnes: 1_000,
      portee: 5_000,
      impressions: 15_000,
    };
    const result = getFilledMetrics(metrics);
    expect(result).toHaveLength(3);
    const keys = result.map((r) => r.key);
    expect(keys).toContain("abonnes");
    expect(keys).toContain("portee");
    expect(keys).toContain("impressions");
  });

  it("exclut les valeurs null (JSON provenant de Supabase)", () => {
    const metrics: NetworkMetrics = { abonnes: null as unknown as number };
    const result = getFilledMetrics(metrics);
    expect(result).toHaveLength(0);
  });
});
