import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "leaflet-textpath";
export default class Ruler {
    private map;
    static readonly THROTTLE_MS = 100;
    static readonly TEXT_OPTIONS: L.TextPathOptions;
    private arrowRenderer;
    protected unit?: string;
    private scaleFactor;
    private layers;
    private pageWidth;
    private pageHeight;
    private canvasWidth;
    constructor(map: L.Map);
    updateDimensions(pageWidth: number, pageHeight: number, canvasWidth: number): void;
    protected init(): void;
    protected shape_name(): string;
    enable(): void;
    updateScale(scaleFactor: number, unit: string): void;
    deactivate(): void;
    protected handleCreateShape({ layer, }: {
        shape: string;
        layer: L.Layer;
    }): void;
    private handleDrawStart;
    protected getPointDist(layer: L.Polyline): number;
    protected getFormattedDist(layer: L.Polyline): string;
}
//# sourceMappingURL=Ruler.d.ts.map