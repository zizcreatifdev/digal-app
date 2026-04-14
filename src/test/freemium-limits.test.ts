import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAccountAccess } from "@/lib/account-access";

// ─── Constants mirrored from the app ────────────────────────────────────────

const FREEMIUM_CLIENT_LIMIT = 2;
const FREEMIUM_ARCHIVE_LIMIT = 3;
const FREEMIUM_TEMPLATE_LIMIT = 3;

// ─── Access guard helpers ────────────────────────────────────────────────────

function canCreateClient(currentActiveCount: number, isFreemium: boolean): boolean {
  if (!isFreemium) return true;
  return currentActiveCount < FREEMIUM_CLIENT_LIMIT;
}

function canArchiveClient(currentArchivedCount: number, isFreemium: boolean): boolean {
  if (!isFreemium) return true;
  return currentArchivedCount < FREEMIUM_ARCHIVE_LIMIT;
}

function canCreateTemplate(currentTemplateCount: number, isFreemium: boolean): boolean {
  if (!isFreemium) return true;
  return currentTemplateCount < FREEMIUM_TEMPLATE_LIMIT;
}

// ─── Freemium client limit (2 actifs max) ────────────────────────────────────

describe("limite clients actifs Freemium (2)", () => {
  it("peut créer un client si count=0", () => {
    expect(canCreateClient(0, true)).toBe(true);
  });

  it("peut créer un client si count=1", () => {
    expect(canCreateClient(1, true)).toBe(true);
  });

  it("bloqué si count=2", () => {
    expect(canCreateClient(2, true)).toBe(false);
  });

  it("bloqué si count > 2", () => {
    expect(canCreateClient(5, true)).toBe(false);
  });

  it("non-freemium peut créer même si count=10", () => {
    expect(canCreateClient(10, false)).toBe(true);
  });
});

// ─── Freemium archive limit (3 max) ──────────────────────────────────────────

describe("limite clients archivés Freemium (3)", () => {
  it("peut archiver si count=0", () => {
    expect(canArchiveClient(0, true)).toBe(true);
  });

  it("peut archiver si count=2", () => {
    expect(canArchiveClient(2, true)).toBe(true);
  });

  it("bloqué si count=3", () => {
    expect(canArchiveClient(3, true)).toBe(false);
  });

  it("bloqué si count > 3", () => {
    expect(canArchiveClient(4, true)).toBe(false);
  });

  it("non-freemium peut archiver même si count=50", () => {
    expect(canArchiveClient(50, false)).toBe(true);
  });
});

// ─── Freemium template limit (3 max) ─────────────────────────────────────────

describe("limite modèles de posts Freemium (3)", () => {
  it("peut créer si count=0", () => {
    expect(canCreateTemplate(0, true)).toBe(true);
  });

  it("peut créer si count=2", () => {
    expect(canCreateTemplate(2, true)).toBe(true);
  });

  it("bloqué si count=3", () => {
    expect(canCreateTemplate(3, true)).toBe(false);
  });

  it("non-freemium peut créer même si count=100", () => {
    expect(canCreateTemplate(100, false)).toBe(true);
  });
});

// ─── getAccountAccess isFreemium flag ────────────────────────────────────────

describe("isFreemium correctement dérivé via getAccountAccess", () => {
  it("freemium sans plan → isFreemium=true", () => {
    const { isFreemium } = getAccountAccess({ role: "freemium", plan: null });
    expect(isFreemium).toBe(true);
    expect(canCreateClient(2, isFreemium)).toBe(false);
    expect(canArchiveClient(3, isFreemium)).toBe(false);
    expect(canCreateTemplate(3, isFreemium)).toBe(false);
  });

  it("rôle solo → isFreemium=false, aucune limite", () => {
    const { isFreemium } = getAccountAccess({ role: "solo", plan: "solo" });
    expect(isFreemium).toBe(false);
    expect(canCreateClient(100, isFreemium)).toBe(true);
    expect(canArchiveClient(100, isFreemium)).toBe(true);
    expect(canCreateTemplate(100, isFreemium)).toBe(true);
  });
});
