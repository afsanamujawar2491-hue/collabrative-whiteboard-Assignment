import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = `${window.location.origin}${location.pathname}${location.search}`;
    login(returnUrl);
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <p className="text-muted">Redirecting to login...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
