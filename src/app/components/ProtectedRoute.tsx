import { Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  role: "admin" | "sello";
  children: React.ReactNode;
}

export function ProtectedRoute({ role, children }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}
