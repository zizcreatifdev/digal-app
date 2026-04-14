import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn(), onAuthStateChange: vi.fn() },
  },
}));

import { getPeriodDates } from "@/lib/preview-links";

// Date de référence : mardi 14 avril 2026
// → semaine courante (lun-dim) : 13–19 avril 2026
// → mois courant : 1–30 avril 2026
// → semaine suivante : 20–26 avril 2026
// → mois suivant : 1–31 mai 2026
const FIXED_DATE = new Date(2026, 3, 14, 12, 0, 0); // April 14, 2026 12:00 local

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getPeriodDates", () => {
  describe("semaine_courante", () => {
    it("start = lundi 13 avril 2026", () => {
      const { start } = getPeriodDates("semaine_courante");
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(3); // avril (0-indexed)
      expect(start.getDate()).toBe(13); // lundi
    });

    it("end = dimanche 19 avril 2026", () => {
      const { end } = getPeriodDates("semaine_courante");
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(3);
      expect(end.getDate()).toBe(19); // dimanche
    });

    it("start est un lundi (getDay() === 1)", () => {
      const { start } = getPeriodDates("semaine_courante");
      expect(start.getDay()).toBe(1); // 1 = lundi
    });

    it("end est un dimanche (getDay() === 0)", () => {
      const { end } = getPeriodDates("semaine_courante");
      expect(end.getDay()).toBe(0); // 0 = dimanche
    });

    it("la durée de la semaine est exactement 7 jours moins 1ms", () => {
      const { start, end } = getPeriodDates("semaine_courante");
      const diff = end.getTime() - start.getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000 - 1;
      expect(diff).toBe(sevenDaysMs);
    });
  });

  describe("mois_courant", () => {
    it("start = 1er avril 2026", () => {
      const { start } = getPeriodDates("mois_courant");
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(3);
      expect(start.getDate()).toBe(1);
    });

    it("end = 30 avril 2026", () => {
      const { end } = getPeriodDates("mois_courant");
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(3);
      expect(end.getDate()).toBe(30); // avril a 30 jours
    });

    it("start est en début de journée (h=0, min=0, s=0)", () => {
      const { start } = getPeriodDates("mois_courant");
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });
  });

  describe("semaine_suivante", () => {
    it("start = lundi 20 avril 2026", () => {
      const { start } = getPeriodDates("semaine_suivante");
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(3);
      expect(start.getDate()).toBe(20);
    });

    it("end = dimanche 26 avril 2026", () => {
      const { end } = getPeriodDates("semaine_suivante");
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(3);
      expect(end.getDate()).toBe(26);
    });

    it("start est un lundi (getDay() === 1)", () => {
      const { start } = getPeriodDates("semaine_suivante");
      expect(start.getDay()).toBe(1);
    });

    it("est bien 7 jours après semaine_courante", () => {
      const { start: startCurrent } = getPeriodDates("semaine_courante");
      const { start: startNext } = getPeriodDates("semaine_suivante");
      const diff = startNext.getTime() - startCurrent.getTime();
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000); // exactement 7 jours
    });
  });

  describe("mois_suivant", () => {
    it("start = 1er mai 2026", () => {
      const { start } = getPeriodDates("mois_suivant");
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(4); // mai (0-indexed)
      expect(start.getDate()).toBe(1);
    });

    it("end = 31 mai 2026", () => {
      const { end } = getPeriodDates("mois_suivant");
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(4);
      expect(end.getDate()).toBe(31); // mai a 31 jours
    });

    it("retourne un mois différent du mois courant", () => {
      const { start: startCurrent } = getPeriodDates("mois_courant");
      const { start: startNext } = getPeriodDates("mois_suivant");
      expect(startNext.getMonth()).toBe(startCurrent.getMonth() + 1);
    });
  });
});
