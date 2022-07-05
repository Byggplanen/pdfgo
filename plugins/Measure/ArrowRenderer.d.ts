import L from "leaflet";
export declare class ArrowRenderer extends L.SVG {
    static readonly ARROWHEAD_LENGTH = 10;
    _addPath(layer: L.Layer): void;
    _removePath(layer: L.Layer): void;
    _setPath(layer: L.Layer, path: string): void;
    _setArrowPath(layer: L.Layer, path: string): void;
}
export declare function arrowRenderer(options?: L.RendererOptions): ArrowRenderer;
//# sourceMappingURL=ArrowRenderer.d.ts.map