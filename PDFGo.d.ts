import "@geoman-io/leaflet-geoman-free";
import { CalibrateCallback } from "./plugins/Measure/Calibrate";
import "./PDFGo.css";
declare type PDFGoProps = {
    element: HTMLDivElement;
    pageNumber?: number;
    minZoom?: number;
    maxZoom?: number;
    zoom?: number;
    onCalibrate?: CalibrateCallback;
};
export default class PDFGo {
    private map;
    private pageNumber;
    private pdfRenderer?;
    private overlay?;
    private measurements?;
    private onCalibrate?;
    private canvasWidth;
    private file?;
    private fileName?;
    constructor({ element, pageNumber, minZoom, maxZoom, zoom, onCalibrate, }: PDFGoProps);
    loadFile(file: Uint8Array, name: string): Promise<void>;
    downloadPdf(): Promise<void>;
    adjustScale(length: number, actualLength: string): void;
    private clearMap;
    private initializeHandlers;
    private initializeToolbar;
    private onZoom;
}
export {};
//# sourceMappingURL=PDFGo.d.ts.map