export type MessageType =
  | "OBJECT_ADDED"
  | "OBJECT_MODIFIED"
  | "OBJECT_REMOVED"
  | "CLEAR"
  | "UNDO"
  | "REDO"
  | "CURSOR_MOVE"
  | "CHAT"
  | "STATE_REQUEST"
  | "STATE_SYNC";

export interface BoardMessage {
  sessionId: string;
  userId: string;
  username: string;
  type: MessageType;
  payload: string;
  timestamp: number;
}

export interface SessionResponse {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  shareUrl: string;
}

export interface ChatMessageResponse {
  id: string;
  sessionId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
}

export interface DrawActionResponse {
  id: string;
  sessionId: string;
  userId: string;
  actionType: string;
  payloadJson: string;
  timestamp: string;
}

export interface InvitationResponse {
  sessionId: string;
  sessionName: string;
}

export interface InviteResponse {
  joinUrl: string;
  emailSent: boolean;
  message: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface RemoteCursor {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string;
  lastSeen: number;
}
