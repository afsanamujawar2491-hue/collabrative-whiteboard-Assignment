import { useEffect, useRef, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import type { Client } from "@stomp/stompjs";

import type { FabricCanvas } from "../types/fabric";



import Navbar from "../components/Navbar";

import Toolbar from "../components/Toolbar";

import Whiteboard from "../components/Whiteboard";

import CursorOverlay from "../components/CursorOverlay";

import ChatPanel from "../components/ChatPanel";

import InviteModal from "../components/InviteModal";

import { createStompClient } from "../services/socket";

import { useAuth } from "../auth/AuthContext";

import { useCanvasHistory } from "../hooks/useCanvasHistory";

import { useCollaboration } from "../hooks/useCollaboration";

import { api } from "../services/api";

import type { SessionResponse } from "../types";



function Board() {

  const { sessionId } = useParams<{ sessionId: string }>();

  const navigate = useNavigate();

  const { user } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);



  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);

  const [selectedTool, setSelectedTool] = useState("pencil");

  const [color, setColor] = useState("#000000");

  const [brushSize, setBrushSize] = useState(5);

  const [session, setSession] = useState<SessionResponse | null>(null);

  const [client, setClient] = useState<Client | null>(null);

  const [connected, setConnected] = useState(false);

  const [showInvite, setShowInvite] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);

  const [error, setError] = useState("");



  const { pushState, undo, redo, initHistory, canUndo, canRedo, isRestoring } =

    useCanvasHistory(canvas, () => {});



  const {

    remoteCursors,

    sendCursorMove,

    broadcastClear,

    broadcastUndoRedo,

    notifyObjectAdded,

  } = useCollaboration({

    canvas,

    sessionId: sessionId || "",

    user: user!,

    client,

    connected,

    pushState,

    isRestoring,

  });



  useEffect(() => {

    if (!sessionId) return;

    api.getSession(sessionId)

      .then(setSession)

      .catch(() => {

        setError("Session not found");

        setTimeout(() => navigate("/"), 2000);

      });

  }, [sessionId, navigate]);



  useEffect(() => {

    if (!user) return;

    const stompClient = createStompClient();

    stompClient.onConnect = () => setConnected(true);

    stompClient.onDisconnect = () => setConnected(false);

    stompClient.activate();

    setClient(stompClient);

    return () => { stompClient.deactivate(); };

  }, [user]);



  useEffect(() => {

    if (canvas) initHistory();

  }, [canvas, initHistory]);



  const handleClear = () => {

    if (!canvas) return;

    canvas.clear();

    canvas.backgroundColor = "#fff";

    canvas.renderAll();

    broadcastClear();

    pushState();

  };



  const handleUndo = () => {

    const json = undo();

    if (json) broadcastUndoRedo("UNDO", json);

  };



  const handleRedo = () => {

    const json = redo();

    if (json) broadcastUndoRedo("REDO", json);

  };



  const copyShareLink = () => {

    if (session?.shareUrl) {

      navigator.clipboard.writeText(session.shareUrl);

    }

  };



  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <p className="text-muted">Loading user...</p>
      </div>
    );
  }



  if (error) {

    return (

      <div className="alert alert-danger m-4">{error} — redirecting home...</div>

    );

  }



  return (

    <div className="d-flex flex-column vh-100 overflow-hidden">

      <Navbar title={session?.name}>

        <span

          className={`badge ${connected ? "bg-success" : "bg-secondary"} d-none d-md-inline`}

        >

          {connected ? "Connected" : "Connecting..."}

        </span>

        <button className="btn btn-outline-light btn-sm" onClick={copyShareLink}>

          Copy Link

        </button>

        <button className="btn btn-outline-light btn-sm" onClick={() => setShowInvite(true)}>

          Invite

        </button>

        <button

          className="btn btn-outline-light btn-sm d-md-none"

          onClick={() => setChatOpen(true)}

        >

          Chat

        </button>

      </Navbar>



      <div className="d-flex flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>

        <div className="d-none d-md-flex h-100 flex-shrink-0">

          <Toolbar

            layout="vertical"

            canvas={canvas}

            selectedTool={selectedTool}

            setSelectedTool={setSelectedTool}

            color={color}

            setColor={setColor}

            brushSize={brushSize}

            setBrushSize={setBrushSize}

            onClear={handleClear}

            onUndo={handleUndo}

            onRedo={handleRedo}

            canUndo={canUndo}

            canRedo={canRedo}

            sessionId={sessionId || ""}

          />

        </div>



        <div

          ref={containerRef}

          className="flex-grow-1 position-relative overflow-hidden whiteboard-touch-area"

          style={{ background: "#f0f2f5", minHeight: 0, minWidth: 0 }}

        >

          <Whiteboard

            canvas={canvas}

            setCanvas={setCanvas}

            selectedTool={selectedTool}

            color={color}

            brushSize={brushSize}

            onCursorMove={sendCursorMove}

            notifyObjectAdded={notifyObjectAdded}

            containerRef={containerRef}

          />

          <CursorOverlay cursors={remoteCursors} />

        </div>



        <div

          className="d-none d-md-flex border-start bg-white flex-column flex-shrink-0"

          style={{ width: 280, minWidth: 280 }}

        >

          {sessionId && (

            <ChatPanel

              sessionId={sessionId}

              user={user}

              client={client}

              connected={connected}

            />

          )}

        </div>

      </div>



      <div className="d-md-none border-top bg-light flex-shrink-0">

        <Toolbar

          layout="horizontal"

          canvas={canvas}

          selectedTool={selectedTool}

          setSelectedTool={setSelectedTool}

          color={color}

          setColor={setColor}

          brushSize={brushSize}

          setBrushSize={setBrushSize}

          onClear={handleClear}

          onUndo={handleUndo}

          onRedo={handleRedo}

          canUndo={canUndo}

          canRedo={canRedo}

          sessionId={sessionId || ""}

        />

      </div>



      <div className="bg-white border-top px-3 py-1 small text-muted d-none d-md-block flex-shrink-0">

        Tool: {selectedTool} · Color: {color} · Size: {brushSize}px

        {sessionId && <> · Session: {sessionId.slice(0, 8)}...</>}

      </div>



      {/* Mobile chat offcanvas */}

      <div

        className={`offcanvas offcanvas-end ${chatOpen ? "show" : ""}`}

        tabIndex={-1}

        style={{ visibility: chatOpen ? "visible" : "hidden", width: "min(100vw, 320px)" }}

      >

        <div className="offcanvas-header">

          <h5 className="offcanvas-title">Live Chat</h5>

          <button

            type="button"

            className="btn-close"

            onClick={() => setChatOpen(false)}

          />

        </div>

        <div className="offcanvas-body p-0 d-flex flex-column" style={{ minHeight: 0 }}>

          {sessionId && (

            <ChatPanel

              sessionId={sessionId}

              user={user}

              client={client}

              connected={connected}

            />

          )}

        </div>

      </div>

      {chatOpen && (

        <div

          className="offcanvas-backdrop fade show d-md-none"

          onClick={() => setChatOpen(false)}

        />

      )}



      {sessionId && (

        <InviteModal

          sessionId={sessionId}

          show={showInvite}

          onClose={() => setShowInvite(false)}

        />

      )}

    </div>

  );

}



export default Board;

