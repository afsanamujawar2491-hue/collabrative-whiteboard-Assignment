import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import { api } from "../services/api";

const INVITE_TOKEN_KEY = "pendingInviteToken";

function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, login, register, loading } = useAuth();
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const token = searchParams.get("token") || sessionStorage.getItem(INVITE_TOKEN_KEY);

  useEffect(() => {
    if (token) sessionStorage.setItem(INVITE_TOKEN_KEY, token);
  }, [token]);

  useEffect(() => {
    if (loading || !isAuthenticated || !token || joining) return;

    setJoining(true);
    api
      .resolveInvitation(token)
      .then((invitation) => {
        sessionStorage.removeItem(INVITE_TOKEN_KEY);
        navigate(`/board/${invitation.sessionId}`, { replace: true });
      })
      .catch((e) => {
        setJoining(false);
        setError(
          e instanceof Error ? e.message : "Invitation link is invalid or expired"
        );
      });
  }, [token, isAuthenticated, loading, navigate, joining]);

  const joinUrl = token
    ? `${window.location.origin}/join?token=${encodeURIComponent(token)}`
    : window.location.href;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-vh-100 bg-light">
        <Navbar />
        <div className="container mt-5">
          <div className="alert alert-danger">Invalid invitation link — no token found.</div>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 bg-light">
        <Navbar />
        <div className="container mt-5">
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-vh-100 bg-light">
        <Navbar />
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card shadow-sm border-0">
                <div className="card-body p-4 text-center">
                  <h4 className="mb-3">Join Whiteboard Session</h4>
                  <p className="text-muted mb-4">
                    You were invited to a whiteboard session. Please log in or create an account to continue.
                  </p>
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => register(joinUrl)}
                      type="button"
                    >
                      Sign Up & Join
                    </button>
                    <button
                      className="btn btn-outline-primary btn-lg"
                      onClick={() => login(joinUrl)}
                      type="button"
                    >
                      Login & Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 gap-3">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Joining session...</span>
      </div>
      <p className="text-muted mb-0">Opening whiteboard session...</p>
    </div>
  );
}

export default JoinPage;
