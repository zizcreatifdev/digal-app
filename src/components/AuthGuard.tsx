import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
  allowedProfileRoles?: string[];
}

export function AuthGuard({ children, requiredRole, allowedProfileRoles }: AuthGuardProps) {
  const { session, userRole, profileRole, profileRoleLoaded, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === "admin" && userRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedProfileRoles && allowedProfileRoles.length > 0) {
    if (!profileRoleLoaded) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    const allowed = profileRole !== null && allowedProfileRoles.includes(profileRole);
    if (!allowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
