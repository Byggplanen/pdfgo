import L from "leaflet";
export declare class CloudPolygon {
    private map;
    private color;
    static readonly SHAPE_NAME = "CloudPolygon";
    private cloudPolylineRenderer;
    constructor(map: L.Map, color?: string);
    private init;
}
export declare function cloudPolygon(map: L.Map): CloudPolygon;
//# sourceMappingURL=index.d.ts.map