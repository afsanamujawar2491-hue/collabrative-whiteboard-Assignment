const API_BASE = "http://localhost:8081/api";

let getToken: () => string | undefined = () => undefined;

export function setTokenProvider(provider: () => string | undefined) {
  getToken = provider;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  createSession: (name?: string) =>
    request<import("../types").SessionResponse>("/sessions", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getSession: (id: string) =>
    request<import("../types").SessionResponse>(`/sessions/${id}`),

  getSessionState: (id: string) =>
    request<{ canvasJson: string }>(`/sessions/${id}/state`),

  inviteUser: (sessionId: string, email: string) =>
    request<import("../types").InviteResponse>(`/sessions/${sessionId}/invite`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resolveInvitation: (token: string) =>
    request<import("../types").InvitationResponse>(`/invitations/${token}`),

  getChatHistory: (sessionId: string) =>
    request<import("../types").ChatMessageResponse[]>(
      `/sessions/${sessionId}/chat`
    ),

  getDrawActions: (sessionId: string) =>
    request<import("../types").DrawActionResponse[]>(
      `/sessions/${sessionId}/actions`
    ),
};
