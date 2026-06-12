import { useEffect, useRef, useCallback, useState } from "react";
import { fabric } from "fabric";
import type { FabricCanvas, FabricObject } from "../types/fabric";
import type { Client } from "@stomp/stompjs";
import type { BoardMessage, RemoteCursor, AuthUser } from "../types";
import { publishDraw, publishCursor } from "../services/socket";
import { api } from "../services/api";
import { cursorColor, throttle } from "../utils/helpers";

interface UseCollaborationOptions {
  canvas: FabricCanvas | null;
  sessionId: string;
  user: AuthUser;
  client: Client | null;
  connected: boolean;
  pushState: () => void;
  isRestoring: React.MutableRefObject<boolean>;
}

export function useCollaboration({
  canvas,
  sessionId,
  user,
  client,
  connected,
  pushState,
  isRestoring,
}: UseCollaborationOptions) {
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const localChange = useRef(false);

  const sendMessage = useCallback(
    (type: BoardMessage["type"], payload: string) => {
      if (!client?.connected) return;
      const msg: BoardMessage = {
        sessionId,
        userId: user.id,
        username: user.username,
        type,
        payload,
        timestamp: Date.now(),
      };
      publishDraw(client, msg);
    },
    [client, sessionId, user]
  );

  const applyRemoteObject = useCallback(
    (payload: string, action: "add" | "modify" | "remove") => {
      if (!canvas) return;
      isRestoring.current = true;

      if (action === "remove") {
        const data = JSON.parse(payload);
        const obj = canvas.getObjects().find(
          (o: FabricObject) => (o as FabricObject & { id?: string }).id === data.id
        );
        if (obj) canvas.remove(obj);
        canvas.renderAll();
        isRestoring.current = false;
        return;
      }

      fabric.util.enlivenObjects(
        [JSON.parse(payload)],
        (objects: FabricObject[]) => {
          if (action === "add") {
            objects.forEach((obj) => canvas.add(obj));
          } else {
            const incoming = objects[0];
            const existing = canvas.getObjects().find(
              (o: FabricObject) =>
                (o as FabricObject & { id?: string }).id ===
                (incoming as FabricObject & { id?: string }).id
            );
            if (existing && incoming) {
              existing.set(incoming.toObject());
            }
          }
          canvas.renderAll();
          isRestoring.current = false;
        },
        ""
      );
    },
    [canvas, isRestoring]
  );

  useEffect(() => {
    if (!canvas || !client || !connected) return;

    const handleBoardMessage = (body: string) => {
      const msg: BoardMessage = JSON.parse(body);
      if (msg.userId === user.id) return;

      if (msg.type === "STATE_SYNC") {
        isRestoring.current = true;
        canvas.loadFromJSON(msg.payload, () => {
          canvas.backgroundColor = "#fff";
          canvas.renderAll();
          isRestoring.current = false;
        });
        return;
      }

      if (msg.type === "CLEAR") {
        isRestoring.current = true;
        canvas.clear();
        canvas.backgroundColor = "#fff";
        canvas.renderAll();
        isRestoring.current = false;
        return;
      }

      if (msg.type === "OBJECT_ADDED") applyRemoteObject(msg.payload, "add");
      if (msg.type === "OBJECT_MODIFIED") applyRemoteObject(msg.payload, "modify");
      if (msg.type === "OBJECT_REMOVED") applyRemoteObject(msg.payload, "remove");
      if (msg.type === "UNDO" || msg.type === "REDO") {
        isRestoring.current = true;
        canvas.loadFromJSON(msg.payload, () => {
          canvas.backgroundColor = "#fff";
          canvas.renderAll();
          isRestoring.current = false;
        });
      }
    };

    const handleCursorMessage = (body: string) => {
      const msg: BoardMessage = JSON.parse(body);
      if (msg.userId === user.id) return;
      const data = JSON.parse(msg.payload);
      setRemoteCursors((prev) => {
        const filtered = prev.filter((c) => c.userId !== msg.userId);
        return [
          ...filtered,
          {
            userId: msg.userId,
            username: msg.username,
            x: data.x,
            y: data.y,
            color: cursorColor(msg.userId),
            lastSeen: Date.now(),
          },
        ];
      });
    };

    client.subscribe(`/topic/board/${sessionId}`, (message) => {
      handleBoardMessage(message.body);
    });

    client.subscribe(`/topic/board/${sessionId}/cursor`, (message) => {
      handleCursorMessage(message.body);
    });

    publishDraw(client, {
      sessionId,
      userId: user.id,
      username: user.username,
      type: "STATE_REQUEST",
      payload: "",
      timestamp: Date.now(),
    });

    api.getSessionState(sessionId).then((state) => {
      const json = state.canvasJson;
      if (json && json !== "{}" && json !== "null") {
        isRestoring.current = true;
        canvas.loadFromJSON(json, () => {
          canvas.backgroundColor = "#fff";
          canvas.renderAll();
          isRestoring.current = false;
        });
      }
    }).catch(() => {});

    return () => {
      client.unsubscribe(`/topic/board/${sessionId}`);
      client.unsubscribe(`/topic/board/${sessionId}/cursor`);
    };
  }, [canvas, client, connected, sessionId, user, applyRemoteObject, isRestoring]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemoteCursors((prev) =>
        prev.filter((c) => Date.now() - c.lastSeen < 3000)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvas) return;

    const onPathCreated = (e: fabric.IEvent<Event>) => {
      if (isRestoring.current) return;
      localChange.current = true;
      const path = (e as fabric.IEvent<Event> & { path?: FabricObject }).path;
      if (!path) return;
      (path as FabricObject & { id?: string }).id = crypto.randomUUID();
      sendMessage("OBJECT_ADDED", JSON.stringify(path.toJSON()));
      pushState();
    };

    const onObjectModified = (e: fabric.IEvent<Event>) => {
      if (isRestoring.current || !e.target) return;
      sendMessage("OBJECT_MODIFIED", JSON.stringify(e.target.toJSON()));
      pushState();
    };

    const onObjectRemoved = (e: fabric.IEvent<Event>) => {
      if (isRestoring.current || !e.target) return;
      sendMessage("OBJECT_REMOVED", JSON.stringify({ id: (e.target as FabricObject & { id?: string }).id }));
      pushState();
    };

    canvas.on("path:created", onPathCreated);
    canvas.on("object:modified", onObjectModified);
    canvas.on("object:removed", onObjectRemoved);

    return () => {
      canvas.off("path:created", onPathCreated);
      canvas.off("object:modified", onObjectModified);
      canvas.off("object:removed", onObjectRemoved);
    };
  }, [canvas, sendMessage, pushState, isRestoring]);

  const broadcastClear = useCallback(() => {
    sendMessage("CLEAR", "");
    pushState();
  }, [sendMessage, pushState]);

  const broadcastStateSync = useCallback(
    (json: string) => {
      sendMessage("STATE_SYNC", json);
    },
    [sendMessage]
  );

  const broadcastUndoRedo = useCallback(
    (type: "UNDO" | "REDO", json: string) => {
      sendMessage(type, json);
    },
    [sendMessage]
  );

  const sendCursorMove = useCallback(
    throttle((x: number, y: number) => {
      if (!client?.connected) return;
      publishCursor(client, {
        sessionId,
        userId: user.id,
        username: user.username,
        type: "CURSOR_MOVE",
        payload: JSON.stringify({ x, y }),
        timestamp: Date.now(),
      });
    }, 50),
    [client, sessionId, user]
  );

  const notifyObjectAdded = useCallback(
    (obj: FabricObject) => {
      if (isRestoring.current) return;
      (obj as FabricObject & { id?: string }).id = crypto.randomUUID();
      sendMessage("OBJECT_ADDED", JSON.stringify(obj.toJSON()));
      pushState();
    },
    [sendMessage, pushState, isRestoring]
  );

  return {
    remoteCursors,
    sendCursorMove,
    broadcastClear,
    broadcastStateSync,
    broadcastUndoRedo,
    notifyObjectAdded,
  };
}
