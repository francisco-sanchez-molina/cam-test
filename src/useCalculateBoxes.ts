import {  useState } from "react";


type BoxPosition = [number, number, number, number, string, number];

const yolo_classes = ["DocumentID"];

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
const processOutput = (output: Float32Array) => {
    let boxes: BoxPosition[] = [];

    for (let index = 0; index < 8400; index++) {
        let bestClass = 0;
        let bestProb = 0;

        // Busca la clase con mayor score
        for (let col = 0; col < 80; col++) {
            const score = output[8400 * (col + 4) + index];
            if (score > bestProb) {
                bestProb = score;
                bestClass = col;
            }
        }

        if (bestProb < 0.5) continue; // Umbral de confianza
        const label = yolo_classes[bestClass];

        // Extraer xc, yc, w, h de la capa de salida
        const xc = output[index];            // centro x normalizado a 640
        const yc = output[8400 + index];     // centro y normalizado a 640
        const w = output[2 * 8400 + index];  // ancho normalizado a 640
        const h = output[3 * 8400 + index];  // alto  normalizado a 640

        // Convertir a valores en [0..1]
        const x1 = (xc - w / 2) / 640;
        const y1 = (yc - h / 2) / 640;
        const x2 = (xc + w / 2) / 640;
        const y2 = (yc + h / 2) / 640;

        boxes.push([x1, y1, x2, y2, label, bestProb]);
    }

    // Non-Max Suppression
    boxes.sort((a, b) => b[5] - a[5]);
    const result: BoxPosition[] = [];
    while (boxes.length > 0) {
        const box = boxes.shift()!;
        result.push(box);
        boxes = boxes.filter((b) => iou(box, b) < 0.7);
    }

    return result;
};

export function useCalculateBoxes() {
    const [boxes, setBoxes] = useState<BoxPosition[]>([]);

    return {
        boxes,
        processResult: (outputMap: any) => {
            const outputData = outputMap["output0"].data;
            const boxes = processOutput(outputData) as BoxPosition[];
            setBoxes(boxes)
        }
    }
}
