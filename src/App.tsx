import { usePrepareCamera } from "./usePrepareCamera";
import { usePrepareDetector } from "./usePrepareDetector";
import { useDrawResult } from "./useDrawResult";
import { useDetector } from "./useDetector";
import { useCalculateBoxes } from "./useCalculateBoxes";
import { useDistanceHint } from "./useDistanceHint";

export const App = () => {
  const videoRef = usePrepareCamera();
  const { executionProvider, setExecutionProvider, sessionRef } =
    usePrepareDetector();
  const { boxes, processResult } = useCalculateBoxes()
  const hint = useDistanceHint(boxes);
  useDetector(sessionRef, videoRef, processResult);

  const canvasRef = useDrawResult(boxes, videoRef);

  return (
    <div>
      <div style={{ width: 500, height: 500, position: "relative" }}>
        <video
          ref={videoRef}
          style={{
            position: "absolute",
            width: "100%",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            width: "100%",
          }}
        />
        <span style={{ position: 'absolute', left: 5, top: 5, color: "white", background: '#00000020' }}>{hint}</span>
      </div>
      <div>
        <label>Execution Provider: </label>
        <select
          aria-label="Execution Provider"
          value={executionProvider}
          onChange={(e) => setExecutionProvider(e.target.value)}
        >
          <option value="webgpu">webgpu</option>
          <option value="wasm">wasm</option>
          <option value="both">Ambos (fallback)</option>
        </select>

        <pre>
          {JSON.stringify(boxes, undefined, 2)}
        </pre>
      </div>
    </div>
  );
};

