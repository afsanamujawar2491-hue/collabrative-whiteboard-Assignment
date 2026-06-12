import { useEffect, useRef, useCallback } from "react";
import { fabric } from "fabric";
import type { FabricCanvas, FabricObject } from "../types/fabric";

interface WhiteboardProps {
  canvas: FabricCanvas | null;
  setCanvas: (canvas: FabricCanvas | null) => void;
  selectedTool: string;
  color: string;
  brushSize: number;
  onCursorMove: (x: number, y: number) => void;
  notifyObjectAdded: (obj: FabricObject) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function Whiteboard({
  canvas,
  setCanvas,
  selectedTool,
  color,
  brushSize,
  onCursorMove,
  notifyObjectAdded,
  containerRef,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const selectedToolRef = useRef(selectedTool);
  const drawingRef = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });
  const activeShape = useRef<FabricObject | null>(null);

  const getSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { width: 800, height: 600 };
    const width = container.clientWidth;
    const height = container.clientHeight;
    return {
      width: width > 0 ? width : 800,
      height: height > 0 ? height : 600,
    };
  }, [containerRef]);

  const resizeCanvas = useCallback(
    (board: FabricCanvas) => {
      const { width, height } = getSize();
      board.setWidth(width);
      board.setHeight(height);
      board.renderAll();
    },
    [getSize]
  );

  // Initialize Fabric canvas once; reset on unmount (Strict Mode safe)
  useEffect(() => {
    if (!canvasRef.current) return;

    const { width, height } = getSize();
    const board = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#fff",
      isDrawingMode: true,
      selection: false,
      allowTouchScrolling: false,
    });

    const brush = new fabric.PencilBrush(board);
    brush.color = color;
    brush.width = brushSize;
    board.freeDrawingBrush = brush;

    fabricRef.current = board;
    setCanvas(board);

    const handleResize = () => resizeCanvas(board);

    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Re-measure after layout settles
    requestAnimationFrame(handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      fabricRef.current = null;
      board.dispose();
      setCanvas(null);
    };
  }, [setCanvas, getSize, resizeCanvas, containerRef]);

  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    const target = fabricRef.current ?? canvas;
    if (!target) return;

    const onPathCreated = (e: fabric.IEvent<Event>) => {
      const path = (e as fabric.IEvent<Event> & { path?: FabricObject }).path;
      if (selectedToolRef.current === "eraser" && path) {
        path.globalCompositeOperation = "destination-out";
      }
      const topCtx = (target as FabricCanvas & { contextTop?: CanvasRenderingContext2D }).contextTop;
      if (topCtx) {
        topCtx.globalCompositeOperation = "source-over";
      }
      target.renderAll();
    };

    target.on("path:created", onPathCreated);
    return () => {
      target.off("path:created", onPathCreated);
    };
  }, [canvas]);

  useEffect(() => {
    const target = fabricRef.current ?? canvas;
    if (!target) return;

    if (selectedTool === "pencil") {
      target.isDrawingMode = true;
      target.selection = false;
      const brush = new fabric.PencilBrush(target);
      brush.color = color;
      brush.width = brushSize;
      target.freeDrawingBrush = brush;
      return;
    }

    if (selectedTool === "eraser") {
      target.isDrawingMode = true;
      target.selection = false;
      const brush = new fabric.PencilBrush(target);
      brush.color = "rgba(255,255,255,1)";
      brush.width = brushSize * 4;
      target.freeDrawingBrush = brush;
      return;
    }

    if (selectedTool === "select") {
      target.isDrawingMode = false;
      target.selection = true;
      return;
    }

    if (selectedTool === "text") {
      target.isDrawingMode = false;
      target.selection = false;
      const text = new fabric.IText("Edit text", {
        left: 100,
        top: 100,
        fill: color,
        fontSize: 24,
      });
      target.add(text);
      target.setActiveObject(text);
      notifyObjectAdded(text);
      return;
    }

    target.isDrawingMode = false;
    target.selection = false;
  }, [selectedTool, color, brushSize, canvas, notifyObjectAdded]);

  useEffect(() => {
    const target = fabricRef.current ?? canvas;
    if (!target) return;

    const shapeTools = ["rectangle", "circle", "line"];

    const onMouseDown = (opt: fabric.IEvent<Event>) => {
      if (!shapeTools.includes(selectedTool)) return;
      const pointer = target.getPointer(opt.e);
      drawingRef.current = true;
      startPoint.current = { x: pointer.x, y: pointer.y };

      if (selectedTool === "rectangle") {
        activeShape.current = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: color,
          strokeWidth: 2,
        });
      } else if (selectedTool === "circle") {
        activeShape.current = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: "transparent",
          stroke: color,
          strokeWidth: 2,
        });
      } else if (selectedTool === "line") {
        activeShape.current = new fabric.Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          { stroke: color, strokeWidth: brushSize }
        );
      }

      if (activeShape.current) {
        target.add(activeShape.current);
      }
    };

    const onMouseMove = (opt: fabric.IEvent<Event>) => {
      const pointer = target.getPointer(opt.e);
      onCursorMove(pointer.x, pointer.y);

      if (!drawingRef.current || !activeShape.current) return;
      const { x, y } = startPoint.current;

      if (selectedTool === "rectangle" && activeShape.current instanceof fabric.Rect) {
        activeShape.current.set({
          width: Math.abs(pointer.x - x),
          height: Math.abs(pointer.y - y),
          left: Math.min(x, pointer.x),
          top: Math.min(y, pointer.y),
        });
      } else if (selectedTool === "circle" && activeShape.current instanceof fabric.Ellipse) {
        activeShape.current.set({
          rx: Math.abs(pointer.x - x) / 2,
          ry: Math.abs(pointer.y - y) / 2,
          left: Math.min(x, pointer.x),
          top: Math.min(y, pointer.y),
        });
      } else if (selectedTool === "line" && activeShape.current instanceof fabric.Line) {
        activeShape.current.set({ x2: pointer.x, y2: pointer.y });
      }

      target.renderAll();
    };

    const onMouseUp = () => {
      if (drawingRef.current && activeShape.current) {
        notifyObjectAdded(activeShape.current);
      }
      drawingRef.current = false;
      activeShape.current = null;
    };

    target.on("mouse:down", onMouseDown);
    target.on("mouse:move", onMouseMove);
    target.on("mouse:up", onMouseUp);

    return () => {
      target.off("mouse:down", onMouseDown);
      target.off("mouse:move", onMouseMove);
      target.off("mouse:up", onMouseUp);
    };
  }, [canvas, selectedTool, color, brushSize, onCursorMove, notifyObjectAdded]);

  return (
    <div
      className="position-absolute top-0 start-0 w-100 h-100 bg-white whiteboard-touch-area"
      style={{ touchAction: "none" }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

export default Whiteboard;
