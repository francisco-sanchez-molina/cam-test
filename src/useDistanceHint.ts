import { useMemo } from "react";
import { BoxPosition } from "./useCalculateBoxes";


export function useDistanceHint(boxes: BoxPosition[]) {

    const distanceHint = useMemo(() => {
        if (!boxes || boxes.length === 0) {
            return "No se detecta documento";
        }

        const areas = boxes.map(([x1, y1, x2, y2]) => {
            const width = x2 - x1;
            const height = y2 - y1;
            return [width * height, width, height];
        }).sort((a, b) => a[0] - b[0]);


        const maxArea = areas[0];


        if (maxArea[1] > 0.7 || maxArea[2] > 0.7) {
            return "Estás demasiado cerca";
        } else if (maxArea[1] > 0.5 || maxArea[2] > 0.5) {
            return "Distancia correcta";
        } else {
            return "Estás demasiado lejos";
        }
    }, [boxes]);

    return distanceHint;
}
