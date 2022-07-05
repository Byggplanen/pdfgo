import L from "leaflet";

import { cloudPolylineRenderer } from "./CloudPolylineRenderer";

export class CloudPolygon {
  static readonly SHAPE_NAME = "CloudPolygon";

  private cloudPolylineRenderer = cloudPolylineRenderer();

  constructor(private map: L.Map, private color: string = "#3388ff") {
    this.init();
  }

  private init() {
    if (
      this.map.pm.Toolbar.getControlOrder().includes(CloudPolygon.SHAPE_NAME)
    ) {
      return;
    }

    this.map.pm.Toolbar.copyDrawControl("Polygon", {
      name: "CloudPolygon",
      block: "draw",
      title: "Draw Revision Cloud",
      className: "leaflet-cloud-icon",
      actions: ["finish", "removeLastVertex", "cancel"],
    });

    this.map.pm.enableDraw("CloudPolygon", {
      pathOptions: { renderer: this.cloudPolylineRenderer },
      hintlineStyle: {
        color: this.color,
        renderer: this.cloudPolylineRenderer,
      },
      templineStyle: { renderer: this.cloudPolylineRenderer },
      allowSelfIntersection: false,
    });

    this.map.pm.disableDraw();
  }
}

export function cloudPolygon(map: L.Map) {
  return new CloudPolygon(map);
}
