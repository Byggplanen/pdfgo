import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
export default class Area {
    private map;
    static readonly SHAPE_NAME = "Area";
    static readonly THROTTLE_MS = 100;
    static readonly TOOLTIP_OPTIONS: L.TooltipOptions;
    private unit?;
    private scaleFactor;
    private layers;
    private pageWidth;
    private pageHeight;
    private canvasWidth;
    constructor(map: L.Map);
    private init;
    updateDimensions(pageWidth: number, pageHeight: number, canvasWidth: number): void;
    enable(): void;
    updateScale(scaleFactor: number, unit: string): void;
    deactivate(): void;
    protected handleCreateShape({ layer, }: {
        shape: string;
        layer: L.Layer;
    }): void;
    private getArea;
}
//# sourceMappingURL=Area.d.ts.map