import React, { useRef, useEffect } from "react";

import { usePrepareCamera } from "./usePrepareCamera";
import { usePrepareDetector } from "./usePrepareDetector";
import { detectionLoop } from "./detectionLoop";

const YOLOWebcamDetector = () => {
  const canvasRef = useRef(null);

  const videoRef = usePrepareCamera();
  const { executionProvider, setExecutionProvider, sessionRef } =
    usePrepareDetector();

  useEffect(() => {
    detectionLoop({
      sessionRef,
      videoRef,
      canvasRef,
    });
  }, []);

  return (
    <div>
      <div style={{ height: 400, width: 400, position: "relative" }}>
        <video
          ref={videoRef}
          style={{
            position: "absolute",
            width: "400px",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            width: "400px",
          }}
        />
      </div>
      <div>
        <label>Execution Provider: </label>
        <select
          value={executionProvider}
          onChange={(e) => setExecutionProvider(e.target.value)}
        >
          <option value="webgpu">webgpu</option>
          <option value="wasm">wasm</option>
          <option value="both">Ambos (fallback)</option>
        </select>
      </div>
    </div>
  );
};

export default YOLOWebcamDetector;
