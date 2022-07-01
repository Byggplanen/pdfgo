import L from "leaflet";
import { PDFPage } from "pdf-lib";

import Ruler from "./Ruler";

export type CalibrateCallback = (length: number) => void;

export default class Calibrate extends Ruler {
  constructor(
    map: L.Map,
    page: PDFPage,
    canvasWidth: number,
    private onCalibrate: CalibrateCallback
  ) {
    super(map, page, canvasWidth);

    // Default pdf-lib unit, 1 pt = 1/72 in
    this.unit = "pt";
  }

  // eslint-disable-next-line class-methods-use-this
  protected shape_name(): string {
    return "Calibrate";
  }

  protected handleCreateShape({
    shape,
    layer,
  }: {
    shape: string;
    layer: L.Layer;
  }): void {
    super.handleCreateShape({ shape, layer });
    const polyline = layer as L.Polyline;
    polyline.setText(null);
    this.onCalibrate(+this.getPointDist(polyline));
    polyline.remove();
  }
}
