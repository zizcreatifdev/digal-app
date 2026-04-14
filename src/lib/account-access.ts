type ProfileLike = {
  role?: string | null;
  plan?: string | null;
};

const PRIVILEGED_ROLES = new Set(["owner", "admin", "dm"]);

export function getAccountAccess(profile?: ProfileLike | null) {
  const role = profile?.role ?? "freemium";
  const plan = profile?.plan ?? null;
  const isPrivileged = PRIVILEGED_ROLES.has(role);
  const isFreemium = !isPrivileged && role === "freemium" && !plan;

  return {
    role,
    plan,
    isPrivileged,
    isFreemium,
  };
}