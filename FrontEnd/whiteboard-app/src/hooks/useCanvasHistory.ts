import { useCallback, useRef, useState } from "react";
import type { FabricCanvas } from "../types/fabric";

export function useCanvasHistory(
  canvas: FabricCanvas | null,
  onStateChange: (json: string) => void
) {
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const isRestoring = useRef(false);
  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  const pushState = useCallback(() => {
    if (!canvas || isRestoring.current) return;
    const json = JSON.stringify(canvas.toJSON());
    undoStack.current.push(json);
    redoStack.current = [];
    bump();
  }, [canvas]);

  const restoreState = useCallback(
    (json: string) => {
      if (!canvas) return;
      isRestoring.current = true;
      canvas.loadFromJSON(json, () => {
        canvas.backgroundColor = "#fff";
        canvas.renderAll();
        isRestoring.current = false;
        onStateChange(json);
        bump();
      });
    },
    [canvas, onStateChange]
  );

  const undo = useCallback(() => {
    if (!canvas || undoStack.current.length < 2) return null;
    const current = undoStack.current.pop()!;
    redoStack.current.push(current);
    const previous = undoStack.current[undoStack.current.length - 1];
    restoreState(previous);
    return previous;
  }, [canvas, restoreState]);

  const redo = useCallback(() => {
    if (!canvas || redoStack.current.length === 0) return null;
    const next = redoStack.current.pop()!;
    undoStack.current.push(next);
    restoreState(next);
    return next;
  }, [canvas, restoreState]);

  const initHistory = useCallback(() => {
    if (!canvas) return;
    undoStack.current = [JSON.stringify(canvas.toJSON())];
    redoStack.current = [];
    bump();
  }, [canvas]);

  return {
    pushState,
    undo,
    redo,
    initHistory,
    canUndo: undoStack.current.length > 1,
    canRedo: redoStack.current.length > 0,
    isRestoring,
  };
}
