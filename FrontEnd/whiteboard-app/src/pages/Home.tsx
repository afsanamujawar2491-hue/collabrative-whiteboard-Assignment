import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import { api } from "../services/api";

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, login, register } = useAuth();
  const [sessionId, setSessionId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createSession = async () => {
    setLoading(true);
    setError("");
    try {
      const session = await api.createSession(sessionName || undefined);
      navigate(`/board/${session.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async () => {
    if (!sessionId.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.getSession(sessionId.trim());
      navigate(`/board/${sessionId.trim()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Session not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="text-center mb-5">
              <h1 className="display-5 fw-bold text-dark">
                Collaborative Whiteboard
              </h1>
              <p className="lead text-muted">
                Draw together in real time. Create a session or join an existing one.
              </p>
            </div>

            {!isAuthenticated ? (
              <div className="card shadow-sm border-0 mx-auto" style={{ maxWidth: 480 }}>
                <div className="card-body p-4 text-center">
                  <h4 className="mb-3">Get Started</h4>
                  <p className="text-muted mb-4">
                    Sign up for a free account or log in to create and join whiteboard sessions.
                  </p>
                  <div className="d-grid gap-2">
                    <button className="btn btn-primary btn-lg" onClick={() => register()}>
                      Sign Up
                    </button>
                    <button className="btn btn-outline-primary btn-lg" onClick={() => login()}>
                      Login
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card shadow-sm h-100 border-0">
                    <div className="card-body p-4">
                      <h4 className="card-title mb-3">Create Session</h4>
                      <input
                        className="form-control mb-3"
                        placeholder="Session name (optional)"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                      />
                      <button
                        className="btn btn-primary w-100"
                        onClick={createSession}
                        disabled={loading}
                      >
                        {loading ? "Creating..." : "Create New Whiteboard"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card shadow-sm h-100 border-0">
                    <div className="card-body p-4">
                      <h4 className="card-title mb-3">Join Session</h4>
                      <input
                        className="form-control mb-3"
                        placeholder="Paste session ID"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                      />
                      <button
                        className="btn btn-success w-100"
                        onClick={joinSession}
                        disabled={loading || !sessionId.trim()}
                      >
                        {loading ? "Joining..." : "Join Whiteboard"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger mt-4">{error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
