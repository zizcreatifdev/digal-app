import { describe, it, expect } from "vitest";
// account-access.ts has no external imports: no Supabase mock needed
import { getAccountAccess } from "@/lib/account-access";

describe("getAccountAccess", () => {
  // ── null / undefined ────────────────────────────────────────────────────

  it("retourne freemium par défaut si profile est null", () => {
    const access = getAccountAccess(null);
    expect(access.role).toBe("freemium");
    expect(access.plan).toBeNull();
    expect(access.isFreemium).toBe(true);
    expect(access.isPrivileged).toBe(false);
  });

  it("retourne freemium par défaut si profile est undefined", () => {
    const access = getAccountAccess(undefined);
    expect(access.isFreemium).toBe(true);
    expect(access.isPrivileged).toBe(false);
  });

  // ── Rôle freemium ────────────────────────────────────────────────────────

  it("identifie correctement le rôle freemium sans plan", () => {
    const access = getAccountAccess({ role: "freemium", plan: null });
    expect(access.isFreemium).toBe(true);
    expect(access.isPrivileged).toBe(false);
    expect(access.role).toBe("freemium");
    expect(access.plan).toBeNull();
  });

  it("n'est pas freemium si le rôle est freemium mais un plan est actif", () => {
    const access = getAccountAccess({ role: "freemium", plan: "solo_standard" });
    expect(access.isFreemium).toBe(false);
    expect(access.plan).toBe("solo_standard");
  });

  // ── Rôles privilégiés ────────────────────────────────────────────────────

  it("identifie 'owner' comme privilégié", () => {
    const access = getAccountAccess({ role: "owner" });
    expect(access.isPrivileged).toBe(true);
    expect(access.isFreemium).toBe(false);
  });

  it("identifie 'admin' comme privilégié", () => {
    const access = getAccountAccess({ role: "admin" });
    expect(access.isPrivileged).toBe(true);
    expect(access.isFreemium).toBe(false);
  });

  it("identifie 'dm' (Digital Manager) comme privilégié", () => {
    const access = getAccountAccess({ role: "dm" });
    expect(access.isPrivileged).toBe(true);
    expect(access.isFreemium).toBe(false);
  });

  // ── Rôles payants non-privilégiés ────────────────────────────────────────

  it("identifie 'solo_standard' comme non-freemium et non-privilégié", () => {
    const access = getAccountAccess({ role: "solo_standard" });
    expect(access.isPrivileged).toBe(false);
    expect(access.isFreemium).toBe(false);
    expect(access.role).toBe("solo_standard");
  });

  it("identifie 'agence_standard' comme non-freemium et non-privilégié", () => {
    const access = getAccountAccess({ role: "agence_standard" });
    expect(access.isPrivileged).toBe(false);
    expect(access.isFreemium).toBe(false);
  });

  it("identifie 'agence_pro' comme non-freemium et non-privilégié", () => {
    const access = getAccountAccess({ role: "agence_pro" });
    expect(access.isPrivileged).toBe(false);
    expect(access.isFreemium).toBe(false);
  });

  // ── Retour de plan ────────────────────────────────────────────────────────

  it("retourne le plan tel quel si fourni", () => {
    const access = getAccountAccess({ role: "solo_standard", plan: "agence_pro" });
    expect(access.plan).toBe("agence_pro");
  });

  it("retourne plan null si absent", () => {
    const access = getAccountAccess({ role: "solo_standard" });
    expect(access.plan).toBeNull();
  });

  // ── Rôle inconnu ─────────────────────────────────────────────────────────

  it("traite un rôle inconnu comme non-privilégié et non-freemium", () => {
    const access = getAccountAccess({ role: "unknown_role" });
    expect(access.isPrivileged).toBe(false);
    // role is "unknown_role", not "freemium" → isFreemium stays false
    expect(access.isFreemium).toBe(false);
  });
});
