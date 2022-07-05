import L from "leaflet";
export declare class CanvasOverlay extends L.Layer {
    _container: HTMLDivElement;
    _canvas: HTMLCanvasElement;
    _bounds: L.LatLngBounds;
    constructor(canvas: HTMLCanvasElement, bounds: L.LatLngBounds, options?: L.LayerOptions);
    onAdd(): this;
    onRemove(): this;
    getEvents(): {
        zoom: () => void;
        viewreset: () => void;
        zoomanim: (e: L.LeafletEvent) => void;
    };
    setCanvas(canvas: HTMLCanvasElement): void;
    getBounds(): L.LatLngBounds;
    _animateZoom(e: L.LeafletEvent): void;
    _reset(): void;
    _initCanvas(): void;
    _initContainer(): void;
}
export declare function canvasOverlay(canvas: HTMLCanvasElement, bounds: L.LatLngBounds, options?: L.LayerOptions): CanvasOverlay;
//# sourceMappingURL=CanvasOverlay.d.ts.map