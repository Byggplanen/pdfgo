import L from "leaflet";
import { generateCloudPathFromPath } from "./cloud-points";

// Extension of L.SVG that hijacks the _setPath() method
// and modifies all L.Polyline layers (and subclasses of it)
// to draw a cloud shape instead of straight lines.
export class CloudPolylineRenderer extends L.SVG {
  constructor(options?: L.RendererOptions, private radius: number = 10) {
    super(options);
  }

  _setPath(layer: L.Layer, path: string): void {
    let modifiedPath = path;

    if (layer instanceof L.Polyline) {
      modifiedPath = generateCloudPathFromPath(
        path,
        this.radius,
        // Invert arcs if rectangle (so they don't point inwards)
        layer instanceof L.Rectangle
      );
    }

    super._setPath(layer, modifiedPath);
  }
}

export function cloudPolylineRenderer(options?: L.RendererOptions) {
  return new CloudPolylineRenderer(options);
}
