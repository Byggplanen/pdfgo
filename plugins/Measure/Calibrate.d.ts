import L from "leaflet";
import Ruler from "./Ruler";
export declare type CalibrateCallback = (length: number) => void;
export default class Calibrate extends Ruler {
    private onCalibrate?;
    constructor(map: L.Map, onCalibrate?: CalibrateCallback | undefined);
    protected shape_name(): string;
    protected handleCreateShape({ shape, layer, }: {
        shape: string;
        layer: L.Layer;
    }): void;
}
//# sourceMappingURL=Calibrate.d.ts.map