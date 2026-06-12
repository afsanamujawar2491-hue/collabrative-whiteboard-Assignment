import { fabric } from "fabric";
import type { DrawActionResponse } from "../types";
import type { FabricCanvas, FabricObject } from "../types/fabric";

export async function exportDrawingVideo(
  actions: DrawActionResponse[],
  onProgress: (pct: number) => void
): Promise<Blob> {
  const width = 1280;
  const height = 720;
  const canvasEl = document.createElement("canvas");
  canvasEl.width = width;
  canvasEl.height = height;

  const canvas = new fabric.Canvas(canvasEl, {
    width,
    height,
    backgroundColor: "#ffffff",
  });

  const stream = canvasEl.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });

  recorder.start();

  const drawActions = actions.filter(
    (a) =>
      a.actionType === "OBJECT_ADDED" ||
      a.actionType === "CLEAR" ||
      a.actionType === "STATE_SYNC"
  );

  if (drawActions.length === 0) {
    await wait(1000);
    recorder.stop();
    canvas.dispose();
    return done;
  }

  let prevTime = new Date(drawActions[0].timestamp).getTime();

  for (let i = 0; i < drawActions.length; i++) {
    const action = drawActions[i];
    const actionTime = new Date(action.timestamp).getTime();
    const delay = Math.min(actionTime - prevTime, 2000);
    prevTime = actionTime;

    await wait(Math.max(delay, 100));
    onProgress(Math.round(((i + 1) / drawActions.length) * 100));

    if (action.actionType === "CLEAR") {
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
    } else if (action.actionType === "STATE_SYNC") {
      await loadJson(canvas, action.payloadJson);
    } else if (action.actionType === "OBJECT_ADDED") {
      await addObject(canvas, action.payloadJson);
    }
  }

  await wait(1000);
  recorder.stop();
  canvas.dispose();
  return done;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadJson(canvas: FabricCanvas, json: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.loadFromJSON(json, () => {
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
      resolve();
    });
  });
}

function addObject(canvas: FabricCanvas, json: string): Promise<void> {
  return new Promise((resolve) => {
    fabric.util.enlivenObjects(
      [JSON.parse(json)],
      (objects: FabricObject[]) => {
        objects.forEach((obj) => canvas.add(obj));
        canvas.renderAll();
        resolve();
      },
      ""
    );
  });
}
