import React, { useRef, useEffect } from "react";

export const usePrepareCamera = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Iniciamos webcam
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => console.error("Error al acceder a la webcam:", err));


    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
 
  }, []);

  return videoRef;
};
