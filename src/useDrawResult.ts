import { RefObject, useEffect, useRef } from "react";

type BoxPosition = [number, number, number, number, string, number];

export function useDrawResult(boxes: BoxPosition[], videoRef: RefObject<HTMLVideoElement | null>) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !videoRef.current) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;


        const width = videoRef.current.videoWidth
        const height = videoRef.current.videoHeight

        canvas.width = width
        canvas.height = height
        ctx.clearRect(0, 0, width, height);

        boxes.forEach(([x1, y1, x2, y2, label]) => {
            const realX1 = x1 * width;
            const realY1 = y1 * height;
            const realX2 = x2 * width;
            const realY2 = y2 * height;

            const boxWidth = realX2 - realX1;
            const boxHeight = realY2 - realY1;

            ctx.save();

            // Configura el glow blanco
            ctx.shadowColor = "#FFFFFF";
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Dibuja el rectángulo con borde verde
            ctx.strokeStyle = "#ffffff60";
            ctx.lineWidth = 3;
            ctx.strokeRect(realX1, realY1, boxWidth, boxHeight);

            // Dibuja el fondo para la etiqueta
            /*ctx.font = "13px Roboto";
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = "#F0F0F0";
            ctx.fillRect(realX1, realY1, textWidth + 10, 25);
 
            // Escribe la etiqueta en negro
            ctx.fillStyle = "#000000";
            ctx.fillText(label, realX1, realY1 + 18);
            */
            // Restaura el estado del contexto (quita el glow)
            ctx.restore();
        });
    }, [boxes]);

    return canvasRef;
}
