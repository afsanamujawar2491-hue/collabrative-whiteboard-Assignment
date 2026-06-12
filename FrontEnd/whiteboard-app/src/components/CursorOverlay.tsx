import type { RemoteCursor } from "../types";

interface CursorOverlayProps {
  cursors: RemoteCursor[];
}

function CursorOverlay({ cursors }: CursorOverlayProps) {
  return (
    <div
      className="position-absolute top-0 start-0 w-100 h-100"
      style={{ pointerEvents: "none", zIndex: 10 }}
    >
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="position-absolute"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: "translate(-2px, -2px)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={cursor.color}>
            <path d="M0 0 L0 14 L4 10 L7 16 L9 15 L6 9 L12 9 Z" />
          </svg>
          <span
            className="badge ms-1"
            style={{ backgroundColor: cursor.color, fontSize: "0.65rem" }}
          >
            {cursor.username}
          </span>
        </div>
      ))}
    </div>
  );
}

export default CursorOverlay;
