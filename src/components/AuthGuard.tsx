import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
  allowedProfileRoles?: string[];
}

// Profile roles that belong in the admin panel, not the user dashboard
const ADMIN_PANEL_ROLES = ["owner", "admin"] as const;

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function AuthGuard({ children, requiredRole, allowedProfileRoles }: AuthGuardProps) {
  const { session, userRole, profileRole, profileRoleLoaded, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return <Spinner />;

  if (!session) return <Navigate to="/login" replace />;

  if (requiredRole === "admin" && userRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // For /dashboard routes: wait for profileRole before rendering.
  // This prevents a brief flash of dashboard content for admin/owner accounts
  // and ensures the redirect below fires immediately on page reload.
  if (pathname.startsWith("/dashboard") && !profileRoleLoaded) {
    return <Spinner />;
  }

  // Owner and admin profile roles must use the admin panel, never the dashboard.
  if (
    profileRoleLoaded &&
    pathname.startsWith("/dashboard") &&
    ADMIN_PANEL_ROLES.includes(profileRole as typeof ADMIN_PANEL_ROLES[number])
  ) {
    return <Navigate to="/admin" replace />;
  }

  if (allowedProfileRoles && allowedProfileRoles.length > 0) {
    if (!profileRoleLoaded) return <Spinner />;
    const allowed = profileRole !== null && allowedProfileRoles.includes(profileRole);
    if (!allowed) return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
