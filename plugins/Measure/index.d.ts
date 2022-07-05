import L from "leaflet";
import { CalibrateCallback } from "./Calibrate";
export default class Measurements {
    private map;
    static readonly CONTROL_NAME: string;
    static readonly LENGTH_REGEX: RegExp;
    private calibrate;
    private ruler;
    private area;
    constructor(map: L.Map, onCalibrate?: CalibrateCallback);
    updateDimensions(pageWidth: number, pageHeight: number, canvasWidth: number): void;
    adjustScale(length: number, actualLength: string): void;
    private init;
}
//# sourceMappingURL=index.d.ts.map