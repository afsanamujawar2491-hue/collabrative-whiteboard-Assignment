import { useEffect, useRef, useState } from "react";
import type { Client } from "@stomp/stompjs";
import type { BoardMessage, ChatMessageResponse, AuthUser } from "../types";
import { publishChat } from "../services/socket";
import { api } from "../services/api";
import { formatTime } from "../utils/helpers";

interface ChatPanelProps {
  sessionId: string;
  user: AuthUser;
  client: Client | null;
  connected: boolean;
}

function ChatPanel({ sessionId, user, client, connected }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    api.getChatHistory(sessionId).then((history) => {
      setMessages(history);
      history.forEach((m) => seenIds.current.add(m.id));
    }).catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    if (!client || !connected) return;

    const sub = client.subscribe(
      `/topic/board/${sessionId}/chat`,
      (message) => {
        const msg: BoardMessage = JSON.parse(message.body);
        const msgId = `${msg.userId}-${msg.timestamp}-${msg.payload}`;
        if (seenIds.current.has(msgId)) return;
        seenIds.current.add(msgId);

        setMessages((prev) => [
          ...prev,
          {
            id: msgId,
            sessionId,
            userId: msg.userId,
            username: msg.username,
            content: msg.payload,
            timestamp: new Date(msg.timestamp).toISOString(),
          },
        ]);
      }
    );

    return () => sub.unsubscribe();
  }, [client, connected, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    if (!client?.connected) {
      setSendError("Not connected. Wait for the connection badge to turn green.");
      return;
    }

    setSendError("");
    const msgId = `${user.id}-${Date.now()}-${text}`;
    seenIds.current.add(msgId);

    const optimistic: ChatMessageResponse = {
      id: msgId,
      sessionId,
      userId: user.id,
      username: user.username,
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    publishChat(client, {
      sessionId,
      userId: user.id,
      username: user.username,
      type: "CHAT",
      payload: text,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="d-flex flex-column h-100">
      <div className="p-2 border-bottom d-flex justify-content-between align-items-center">
        <span className="fw-semibold small text-muted">Live Chat</span>
        <span className={`badge ${connected ? "bg-success" : "bg-secondary"}`}>
          {connected ? "Live" : "Offline"}
        </span>
      </div>
      <div className="flex-grow-1 overflow-auto p-2" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <p className="text-muted small text-center mt-3">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.userId === user.id;
          return (
            <div key={msg.id} className={`mb-2 ${isOwn ? "text-end" : ""}`}>
              <div className="small text-muted">
                {msg.username} · {formatTime(msg.timestamp)}
              </div>
              <div
                className={`d-inline-block px-2 py-1 rounded ${
                  isOwn ? "bg-primary text-white" : "bg-light"
                }`}
                style={{ maxWidth: "85%", wordBreak: "break-word" }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-top">
        {sendError && (
          <div className="alert alert-warning py-1 px-2 small mb-2">{sendError}</div>
        )}
        <div className="d-flex gap-1">
          <input
            className="form-control form-control-sm"
            placeholder={connected ? "Type a message..." : "Connecting..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            autoComplete="off"
            disabled={!connected}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={send}
            disabled={!connected || !input.trim()}
            type="button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
