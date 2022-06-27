import L from "leaflet";
import GeoJSON from "geojson";

import { generateCloudPathFromPoints } from "./cloud-points";

// Extension of L.Polyline that draws repeated arcs instead of
// a straight line between points. Only works with the SVG renderer.
export class CloudPolyline extends L.Polyline<GeoJSON.LineString> {
  static readonly RADIUS = 10;

  constructor(latlngs: L.LatLngExpression[], options?: L.PolylineOptions) {
    super(latlngs, options);
  }

  // Not a multi polyline, so `getLatLngs` should return a 1d array
  getLatLngs(): L.LatLng[] {
    return super.getLatLngs() as L.LatLng[];
  }

  // Invoked by Path._reset()
  _update() {
    if (!this._map) {
      // Layer has not been added to a map yet
      return;
    }

    this._setPath();
  }

  _setPath() {
    const plPoints = this.getLatLngs().map((latLng) =>
      this._map.latLngToLayerPoint(latLng)
    );

    const path = generateCloudPathFromPoints(plPoints, CloudPolyline.RADIUS);
    this._getRenderer()._setPath(this, path);
  }

  _getRenderer(): L.SVG {
    const renderer = this._map.getRenderer(this);
    if (!(renderer instanceof L.SVG)) {
      throw new Error("CloudPolyline requires the renderer to be SVG");
    }

    return this._map.getRenderer(this) as L.SVG;
  }
}

export function cloudPolyline(
  latlngs: L.LatLngExpression[],
  options?: L.PolylineOptions
) {
  return new CloudPolyline(latlngs, options);
}
