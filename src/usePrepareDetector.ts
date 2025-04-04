import { useRef, useEffect, useState } from "react";
import { InferenceSession } from "onnxruntime-web";

export const usePrepareDetector = () => {
  const [executionProvider, setExecutionProvider] = useState("webgpu");
  const sessionRef = useRef<InferenceSession>(null);
  useEffect(() => {
    let mounted = true;
    const providers =
      executionProvider === "both" ? ["webgpu", "wasm"] : [executionProvider];

    const mount = () => {
      InferenceSession.create("best.onnx", {
        executionProviders: providers,
      })
        .then((session) => {
          if (mounted) {
            sessionRef.current = session;
          }
        })
        .catch((err: unknown) => {
          console.error("Error al cargar el modelo:", err);
          setTimeout(() => {
            mount();
          }, 1000);
        });
    };

    mount();
    return () => {
      if (sessionRef.current) {
        sessionRef.current = null;
      }
      mounted = false;
    };
  }, [executionProvider]);

  return {
    executionProvider,
    setExecutionProvider,
    sessionRef,
  };
};
