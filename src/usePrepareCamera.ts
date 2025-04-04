import { useRef, useEffect } from "react";

export const usePrepareCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => console.error("webcam error:", err));


    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const srcObject = videoRef.current.srcObject as any
        srcObject.getTracks().forEach((track: any) => track.stop());
      }
    };

  }, []);

  return videoRef;
};
