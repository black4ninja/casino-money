import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "@/storage/auth";
import { useAuthStore } from "@/stores/authStore";

const HIERARCHY: Record<Role, readonly Role[]> = {
  player: ["player"],
  dealer: ["dealer"],
  master: ["master", "dealer"],
};

function hasAnyRole(actual: Role, required: readonly Role[]): boolean {
  return required.some((r) => HIERARCHY[actual].includes(r));
}

type Props = {
  children: ReactNode;
  /** If omitted, only authentication is required. */
  allowedRoles?: readonly Role[];
};

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  if (allowedRoles && !hasAnyRole(user.role, allowedRoles)) {
    // User is signed in but lacks role → bounce to their own dashboard.
    const target =
      user.role === "master"
        ? "/admin"
        : user.role === "dealer"
          ? "/dealer"
          : "/player";
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
}
