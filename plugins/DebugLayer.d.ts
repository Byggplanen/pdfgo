import L from "leaflet";
export declare class DebugLayer extends L.GridLayer {
    createTile(coords: L.Coords): HTMLDivElement;
}
export declare function debugLayer(options?: L.GridLayerOptions): DebugLayer;
//# sourceMappingURL=DebugLayer.d.ts.map