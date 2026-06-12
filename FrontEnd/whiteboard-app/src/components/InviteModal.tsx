import { useState } from "react";
import { api } from "../services/api";

interface InviteModalProps {
  sessionId: string;
  show: boolean;
  onClose: () => void;
}

function InviteModal({ sessionId, show, onClose }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  if (!show) return null;

  const sendInvite = async () => {
    if (!email.trim()) {
      setError("Please enter an email address.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError("");
    setJoinUrl("");
    setInfoMessage("");
    try {
      const result = await api.inviteUser(sessionId, email.trim());
      setStatus("sent");
      setJoinUrl(result.joinUrl);
      setInfoMessage(result.message);
      setEmail("");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to send invite");
    }
  };

  const copyJoinLink = () => {
    if (joinUrl) navigator.clipboard.writeText(joinUrl);
  };

  const handleClose = () => {
    onClose();
    setStatus("idle");
    setError("");
    setJoinUrl("");
    setInfoMessage("");
  };

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ zIndex: 1060 }}
        onClick={handleClose}
      >
        <div
          className="modal-dialog modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Invite Collaborator</h5>
              <button type="button" className="btn-close" onClick={handleClose} />
            </div>
            <div className="modal-body">
              <label className="form-label" htmlFor="invite-email">
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                className="form-control"
                placeholder="collaborator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                autoComplete="email"
              />
              {status === "sent" && (
                <div className="alert alert-success mt-3 mb-0 py-2 small">
                  {infoMessage}
                  {joinUrl && (
                    <div className="mt-2">
                      <div className="text-break fw-semibold">{joinUrl}</div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success mt-2"
                        onClick={copyJoinLink}
                      >
                        Copy Join Link
                      </button>
                    </div>
                  )}
                </div>
              )}
              {status === "error" && (
                <div className="alert alert-danger mt-3 mb-0 py-2 small">{error}</div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={sendInvite}
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />
    </>
  );
}

export default InviteModal;
