import L from "leaflet";

import Ruler from "./Ruler";

export type CalibrateCallback = (length: number, element: Element) => void;

export default class Calibrate extends Ruler {
  constructor(map: L.Map, private onCalibrate?: CalibrateCallback) {
    super(map);

    // Default pdf-lib unit, 1 pt = 1/72 in
    this.unit = "pt";
  }

  // eslint-disable-next-line class-methods-use-this
  protected shape_name(): string {
    return "Calibrate";
  }

  protected handleCreateShape({
    layer,
  }: {
    shape: string;
    layer: L.Layer;
  }): void {
    const polyline = layer as L.Polyline;
    polyline.setText(null);
    this.onCalibrate?.(
      +this.getPointDist(polyline),
      document.querySelector(".leaflet-ruler-icon")!
    );
    polyline.remove();
  }
}
