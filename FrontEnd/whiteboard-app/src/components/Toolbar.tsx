import type { FabricCanvas } from "../types/fabric";
import jsPDF from "jspdf";
import { api } from "../services/api";
import { exportDrawingVideo } from "../utils/videoExporter";

interface ToolbarProps {
  canvas: FabricCanvas | null;
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  sessionId: string;
  layout?: "vertical" | "horizontal";
}

const TOOLS = [
  { id: "select", label: "Select", icon: "↖" },
  { id: "pencil", label: "Pen", icon: "✏" },
  { id: "eraser", label: "Eraser", icon: "🧹" },
  { id: "rectangle", label: "Rect", icon: "▭" },
  { id: "circle", label: "Circle", icon: "○" },
  { id: "line", label: "Line", icon: "─" },
  { id: "text", label: "Text", icon: "T" },
];

function Toolbar({
  canvas,
  selectedTool,
  setSelectedTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  sessionId,
  layout = "vertical",
}: ToolbarProps) {
  const isVertical = layout === "vertical";

  const savePNG = () => {
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL({ format: "png" });
    link.click();
  };

  const savePDF = () => {
    if (!canvas) return;
    const pdf = new jsPDF({
      orientation: canvas.getWidth() > canvas.getHeight() ? "landscape" : "portrait",
    });
    const img = canvas.toDataURL({ format: "png" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(img, "PNG", 10, 10, pageWidth - 20, pageHeight - 20);
    pdf.save("whiteboard.pdf");
  };

  const exportVideo = async () => {
    try {
      const actions = await api.getDrawActions(sessionId);
      const blob = await exportDrawingVideo(actions, () => {});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "whiteboard-replay.webm";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Video export failed. Draw something first.");
    }
  };

  const toolBtn = (tool: (typeof TOOLS)[0]) => (
    <button
      key={tool.id}
      className={`btn btn-sm ${
        selectedTool === tool.id ? "btn-primary" : "btn-outline-secondary"
      }`}
      title={tool.label}
      onClick={() => setSelectedTool(tool.id)}
      type="button"
    >
      {tool.icon}
    </button>
  );

  const colorPicker = (
    <div className="d-flex flex-column align-items-center gap-1">
      <label
        className="rounded border position-relative mb-0"
        title="Pick color"
        style={{
          width: isVertical ? 44 : 36,
          height: isVertical ? 44 : 36,
          backgroundColor: color,
          cursor: "pointer",
          display: "block",
        }}
      >
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
          style={{ cursor: "pointer" }}
        />
      </label>
      {isVertical && <span className="small text-muted">{color}</span>}
    </div>
  );

  const sizeSlider = (
    <div
      className={`d-flex ${isVertical ? "flex-column align-items-center" : "align-items-center"} gap-1`}
      style={isVertical ? { width: "100%" } : { minWidth: 100 }}
    >
      {!isVertical && <span className="small text-muted">Size</span>}
      <input
        type="range"
        min={1}
        max={30}
        value={brushSize}
        onChange={(e) => setBrushSize(Number(e.target.value))}
        title={`Brush size: ${brushSize}`}
        className="form-range"
        style={isVertical ? { width: "100%" } : { width: 90 }}
      />
      <span className="small text-muted">{brushSize}px</span>
    </div>
  );

  const actionButtons = (
    <>
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
        type="button"
      >
        ↩
      </button>
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
        type="button"
      >
        ↪
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={onClear}
        title="Clear"
        type="button"
      >
        🗑
      </button>
    </>
  );

  const exportButtons = (
    <>
      <button className="btn btn-sm btn-outline-success" onClick={savePNG} title="PNG" type="button">
        PNG
      </button>
      <button className="btn btn-sm btn-outline-success" onClick={savePDF} title="PDF" type="button">
        PDF
      </button>
      <button className="btn btn-sm btn-outline-success" onClick={exportVideo} title="Video" type="button">
        VID
      </button>
    </>
  );

  if (!isVertical) {
    return (
      <div
        className="d-flex flex-row flex-nowrap align-items-center gap-2 p-2 bg-light w-100 overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`btn btn-sm flex-shrink-0 ${
              selectedTool === tool.id ? "btn-primary" : "btn-outline-secondary"
            }`}
            title={tool.label}
            onClick={() => setSelectedTool(tool.id)}
            type="button"
          >
            {tool.icon} <span className="small">{tool.label}</span>
          </button>
        ))}
        <div className="vr mx-1" />
        {colorPicker}
        {sizeSlider}
        <div className="vr mx-1" />
        {actionButtons}
        <div className="vr mx-1" />
        {exportButtons}
      </div>
    );
  }

  return (
    <div
      className="d-flex flex-column gap-2 p-2 bg-light border-end h-100 overflow-y-auto"
      style={{ width: 80, minWidth: 80, WebkitOverflowScrolling: "touch" }}
    >
      {TOOLS.map(toolBtn)}
      <hr className="my-1 w-100" />
      {colorPicker}
      {sizeSlider}
      <hr className="my-1 w-100" />
      {actionButtons}
      <hr className="my-1 w-100" />
      {exportButtons}
    </div>
  );
}

export default Toolbar;
