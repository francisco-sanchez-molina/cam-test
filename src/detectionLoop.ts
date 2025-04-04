import { InferenceSession } from "onnxruntime-web";
import { Tensor } from "onnxruntime-web";
import { RefObject } from "react";

const yolo_classes = ["DocumentID"];

type BoxPosition = [number, number, number, number, string, number]

const intersection = (box1: BoxPosition, box2: BoxPosition) => {
  const [x1, y1, x2, y2] = box1;
  const [x1b, y1b, x2b, y2b] = box2;
  const interX1 = Math.max(x1, x1b);
  const interY1 = Math.max(y1, y1b);
  const interX2 = Math.min(x2, x2b);
  const interY2 = Math.min(y2, y2b);
  return Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
};

const union = (box1: BoxPosition, box2: BoxPosition) => {
  const [x1, y1, x2, y2] = box1;
  const [x1b, y1b, x2b, y2b] = box2;
  const area1 = (x2 - x1) * (y2 - y1);
  const area2 = (x2b - x1b) * (y2b - y1b);
  return area1 + area2 - intersection(box1, box2);
};

const iou = (box1: BoxPosition, box2: BoxPosition) => {
  return intersection(box1, box2) / union(box1, box2);
};

const processOutput = (output: any[], imgWidth: number, imgHeight: number) => {
  let boxes: BoxPosition[] = [];
  // Se asume 8400 predicciones (como en el ejemplo)
  for (let index = 0; index < 8400; index++) {
    let bestClass = 0;
    let bestProb = 0;
    for (let col = 0; col < 80; col++) {
      const score = output[8400 * (col + 4) + index];
      if (score > bestProb) {
        bestProb = score;
        bestClass = col;
      }
    }
    if (bestProb < 0.5) continue;
    const label = yolo_classes[bestClass];
    const xc = output[index];
    const yc = output[8400 + index];
    const w = output[2 * 8400 + index];
    const h = output[3 * 8400 + index];
    const x1 = ((xc - w / 2) / 640) * imgWidth;
    const y1 = ((yc - h / 2) / 640) * imgHeight;
    const x2 = ((xc + w / 2) / 640) * imgWidth;
    const y2 = ((yc + h / 2) / 640) * imgHeight;
    boxes.push([x1, y1, x2, y2, label, bestProb]);
  }
  boxes.sort((a, b) => b[5] - a[5]);
  const result: BoxPosition[] = [];
  while (boxes.length > 0) {
    const box = boxes.shift();
    if (box) {
      result.push(box);
      boxes = boxes.filter((b) => iou(box, b) < 0.7);
    }
  }
  return result;
};

let lastDetectionTime = Date.now();

type Props = {
  sessionRef: RefObject<InferenceSession | null>
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
}

export const detectionLoop = async ({ sessionRef, videoRef, canvasRef }: Props) => {
  
  const retry = (timeout = 1000) => {
    setTimeout(() => detectionLoop({ sessionRef, videoRef, canvasRef }), timeout);
  }

  if (Date.now() - lastDetectionTime < 100) {
    return retry(50)
  }

  lastDetectionTime = Date.now();
  const session = sessionRef.current;
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!session || !video || !canvas || !video.videoWidth || !video.videoHeight) {
    return retry()
  }

  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("no ctx");
      return retry()
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const offscreen = document.createElement("canvas");
    offscreen.width = 640;
    offscreen.height = 640;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) {
      console.error("no offCtx");
      return retry()
    }


    offCtx.drawImage(video, 0, 0, 640, 640);
    const imgData = offCtx.getImageData(0, 0, 640, 640);
    const pixels = imgData.data;
    const red = [];
    const green = [];
    const blue = [];
    for (let i = 0; i < pixels.length; i += 4) {
      red.push(pixels[i] / 255.0);
      green.push(pixels[i + 1] / 255.0);
      blue.push(pixels[i + 2] / 255.0);
    }
    const inputData = Float32Array.from([...red, ...green, ...blue]);
    const tensor = new Tensor("float32", inputData, [1, 3, 640, 640]);

    const outputMap = await session.run({ images: tensor });
    const outputData = outputMap["output0"].data;
    const boxes = processOutput(outputData, canvas.width, canvas.height) as BoxPosition[];

    boxes.forEach(([x1, y1, x2, y2, label]) => {
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.font = "18px serif";
      ctx.fillStyle = "#00FF00";
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x1, y1, textWidth + 10, 25);
      ctx.fillStyle = "#000000";
      ctx.fillText(label, x1, y1 + 18);
    });
  } catch (err) {
    console.error("Error al ejecutar el modelo:", err);
    return retry()
  }
  return retry(50)
};
