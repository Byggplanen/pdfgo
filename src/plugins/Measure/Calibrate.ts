import L from "leaflet";
import Ruler from "./Ruler";

export default class Calibrate extends Ruler {
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
    console.log(`Calibrate with ${this.getDist(polyline)}`);
    polyline.remove();
  }
}
