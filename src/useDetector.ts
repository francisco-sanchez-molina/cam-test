import { useEffect, useRef, RefObject } from "react";
import { InferenceSession, Tensor } from "onnxruntime-web";


export function useDetector(
    sessionRef: RefObject<InferenceSession | null>,
    videoRef: RefObject<HTMLVideoElement | null>,
    processResult: (result: any) => void
) {
    const lastDetectionTimeRef = useRef(Date.now());

    useEffect(() => {

        const detectionLoop = async () => {
            const retry = (timeout = 1000) => {
                setTimeout(() => detectionLoop(), timeout);
            }

            if (Date.now() - lastDetectionTimeRef.current < 100) {
                return retry(50)
            }

            lastDetectionTimeRef.current = Date.now();
            const session = sessionRef.current;
            const video = videoRef.current;

            if (!session || !video || !video.videoWidth || !video.videoHeight) {
                return retry()
            }

            try {
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
                processResult(outputMap)
            } catch (err) {
                console.error("Error al ejecutar el modelo:", err);
                return retry()
            }
            return retry(50)
        };

        detectionLoop();
    }, [sessionRef, videoRef]);

}
