import React, { useRef, useEffect } from "react";
import * as ort from "onnxruntime-web";

const YOLOWebcamDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  let detecting = true;

  // Funciones de procesamiento de salida y utilidades
  const yolo_classes = ["DocumentID"];

  const intersection = (box1, box2) => {
    const [x1, y1, x2, y2] = box1;
    const [x1b, y1b, x2b, y2b] = box2;
    const interX1 = Math.max(x1, x1b);
    const interY1 = Math.max(y1, y1b);
    const interX2 = Math.min(x2, x2b);
    const interY2 = Math.min(y2, y2b);
    return Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
  };

  const union = (box1, box2) => {
    const [x1, y1, x2, y2] = box1;
    const [x1b, y1b, x2b, y2b] = box2;
    const area1 = (x2 - x1) * (y2 - y1);
    const area2 = (x2b - x1b) * (y2b - y1b);
    return area1 + area2 - intersection(box1, box2);
  };

  const iou = (box1, box2) => {
    return intersection(box1, box2) / union(box1, box2);
  };

  const processOutput = (output, imgWidth, imgHeight) => {
    let boxes = [];
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
    // Ordena por probabilidad
    boxes.sort((a, b) => b[5] - a[5]);
    const result = [];
    while (boxes.length > 0) {
      const box = boxes.shift();
      result.push(box);
      boxes = boxes.filter((b) => iou(box, b) < 0.7);
    }
    return result;
  };

  // Bucle de detección
  const detectionLoop = async () => {
    if (!detecting) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Actualiza tamaño del canvas según el video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    //ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Prepara la imagen redimensionándola a 640x640 en un canvas offscreen
    const offscreen = document.createElement("canvas");
    offscreen.width = 640;
    offscreen.height = 640;
    const offCtx = offscreen.getContext("2d");
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
    const tensor = new ort.Tensor("float32", inputData, [1, 3, 640, 640]);

    try {
      // Ejecuta la inferencia con el modelo cargado
      const outputMap = await sessionRef.current.run({ images: tensor });
      const outputData = outputMap["output0"].data;
      const boxes = processOutput(outputData, canvas.width, canvas.height);

      // Vuelve a dibujar el frame (para limpiar cajas anteriores)
     // ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Dibuja las cajas detectadas
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
    }
    requestAnimationFrame(detectionLoop);
  };

  useEffect(() => {
    // Carga del modelo ONNX
    ort.InferenceSession.create("static/best.onnx")
      .then((session) => {
        sessionRef.current = session;
      })
      .catch((err) => console.error("Error al cargar el modelo:", err));

    // Acceso a la webcam
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch((err) => console.error("Error al acceder a la webcam:", err));

    // Inicia el bucle cuando el video se esté reproduciendo
    videoRef.current.addEventListener("playing", () => {
      detectionLoop();
    });

    // Limpieza al desmontar
    return () => {
      detecting = false;
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div position="relative">
      {/* Video oculto para capturar la webcam */}
      <video ref={videoRef}
      style={{
        position: "absolute",
        width: "400px",
      }}>
        {/* Canvas donde se dibuja el video y los bounding boxes */}
      </video>
      <canvas ref={canvasRef} style={{
        position: "absolute",
        width: "400px",
      }} />

    </div>
  );
};

export default YOLOWebcamDetector;
