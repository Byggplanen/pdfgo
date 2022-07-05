import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import { PDFPage } from "pdf-lib";
declare type PDFExporterProps = {
    file: Uint8Array;
    name: string;
    canvasWidth: number;
};
export declare type GeomanLayer = (L.Polyline | L.Marker | L.CircleMarker | L.Polygon) & {
    pm: L.PM.PMLayer;
};
export default class PDFExporter {
    static readonly STROKE_WIDTH = 6;
    static readonly SHAPE_OPACITY = 0.2;
    static readonly COLOR: import("pdf-lib").RGB;
    static readonly FONT_SIZE = 16;
    static readonly CLOUD_RADIUS = 10;
    private pdf;
    private name;
    private canvasWidth;
    private markerImage?;
    private font?;
    constructor({ file, name, canvasWidth }: PDFExporterProps);
    getPage(pageNumber: number): Promise<PDFPage>;
    drawLayers(layers: GeomanLayer[], pageNumber: number): Promise<void>;
    downloadPdf(): Promise<void>;
    private loadAssets;
    private drawText;
    private static drawPolygon;
    private static drawCloudPolygon;
    private static drawCircle;
    private static drawLine;
    private drawMarker;
    private drawRuler;
    private drawArea;
    private static setOpacity;
    private static generateOpacityState;
    private toGeoJSON;
    private geoJSONToPDFCoords;
}
export {};
//# sourceMappingURL=PDFExporter.d.ts.map