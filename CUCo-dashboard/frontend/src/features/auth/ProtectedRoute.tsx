import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null; // or a loader
  return user ? <Outlet /> : <Navigate to="/" replace state={{ from: location }} />;
}