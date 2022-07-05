import L from "leaflet";
export declare class CloudPolylineRenderer extends L.SVG {
    private radius;
    constructor(options?: L.RendererOptions, radius?: number);
    _setPath(layer: L.Layer, path: string): void;
}
export declare function cloudPolylineRenderer(options?: L.RendererOptions): CloudPolylineRenderer;
//# sourceMappingURL=CloudPolylineRenderer.d.ts.map