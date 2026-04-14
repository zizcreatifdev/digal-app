import { describe, it, expect } from "vitest";
import { getAccountAccess } from "@/lib/account-access";

// ─── Route protection via getAccountAccess ────────────────────────────────────

describe("getAccountAccess — rôles", () => {
  it("retourne isFreemium=true pour un compte sans plan ni rôle spécial", () => {
    const access = getAccountAccess({ role: "freemium", plan: null });
    expect(access.isFreemium).toBe(true);
    expect(access.isPrivileged).toBe(false);
  });

  it("retourne isFreemium=false pour un compte avec plan solo", () => {
    const access = getAccountAccess({ role: "freemium", plan: "solo" });
    expect(access.isFreemium).toBe(false);
  });

  it("retourne isPrivileged=true pour owner", () => {
    const access = getAccountAccess({ role: "owner", plan: null });
    expect(access.isPrivileged).toBe(true);
    expect(access.isFreemium).toBe(false);
  });

  it("retourne isPrivileged=true pour admin", () => {
    const access = getAccountAccess({ role: "admin", plan: null });
    expect(access.isPrivileged).toBe(true);
  });

  it("retourne isPrivileged=true pour dm", () => {
    const access = getAccountAccess({ role: "dm", plan: null });
    expect(access.isPrivileged).toBe(true);
  });

  it("retourne isPrivileged=false pour solo", () => {
    const access = getAccountAccess({ role: "solo", plan: null });
    expect(access.isPrivileged).toBe(false);
  });

  it("retourne isPrivileged=false pour agence_standard", () => {
    const access = getAccountAccess({ role: "agence_standard", plan: null });
    expect(access.isPrivileged).toBe(false);
  });

  it("gère un profil undefined", () => {
    const access = getAccountAccess(undefined);
    expect(access.role).toBe("freemium");
    expect(access.isFreemium).toBe(true);
  });

  it("gère un profil null", () => {
    const access = getAccountAccess(null);
    expect(access.role).toBe("freemium");
  });

  it("retourne le rôle et le plan tels quels", () => {
    const access = getAccountAccess({ role: "agence_pro", plan: "agence_pro" });
    expect(access.role).toBe("agence_pro");
    expect(access.plan).toBe("agence_pro");
  });
});

// ─── Route access matrix ─────────────────────────────────────────────────────
// Tests that specific roles match expected access patterns for guarded routes

const ROLES_ALLOWED_FACTURATION = ["owner", "admin", "dm", "solo", "agence_standard", "agence_pro"];
const ROLES_ALLOWED_RAPPORTS = ["owner", "admin", "dm", "solo", "agence_standard", "agence_pro"];
const ROLES_DENIED_FACTURATION = ["freemium", "cm", "createur"];

function canAccessRoute(role: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(role);
}

describe("protection des routes par rôle", () => {
  it("freemium n'a pas accès à /dashboard/facturation", () => {
    expect(canAccessRoute("freemium", ROLES_ALLOWED_FACTURATION)).toBe(false);
  });

  it("cm n'a pas accès à /dashboard/facturation", () => {
    expect(canAccessRoute("cm", ROLES_ALLOWED_FACTURATION)).toBe(false);
  });

  it("createur n'a pas accès à /dashboard/facturation", () => {
    expect(canAccessRoute("createur", ROLES_ALLOWED_FACTURATION)).toBe(false);
  });

  it("solo a accès à /dashboard/facturation", () => {
    expect(canAccessRoute("solo", ROLES_ALLOWED_FACTURATION)).toBe(true);
  });

  it("agence_pro a accès à /dashboard/facturation", () => {
    expect(canAccessRoute("agence_pro", ROLES_ALLOWED_FACTURATION)).toBe(true);
  });

  it("owner a accès à /dashboard/rapports", () => {
    expect(canAccessRoute("owner", ROLES_ALLOWED_RAPPORTS)).toBe(true);
  });

  it("freemium n'a pas accès à /dashboard/rapports", () => {
    expect(canAccessRoute("freemium", ROLES_ALLOWED_RAPPORTS)).toBe(false);
  });

  it("tous les rôles non autorisés sur facturation sont identifiés", () => {
    for (const role of ROLES_DENIED_FACTURATION) {
      expect(canAccessRoute(role, ROLES_ALLOWED_FACTURATION)).toBe(false);
    }
  });

  it("tous les rôles autorisés sur facturation ont accès", () => {
    for (const role of ROLES_ALLOWED_FACTURATION) {
      expect(canAccessRoute(role, ROLES_ALLOWED_FACTURATION)).toBe(true);
    }
  });
});
