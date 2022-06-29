import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "leaflet-textpath";
import { PDFPage } from "pdf-lib";

import { toPDFCoords } from "../units";

export default class Ruler {
  static readonly SHAPE_NAME = "Ruler";

  static readonly TEXT_OPTIONS: L.TextPathOptions = {
    center: true,
    offset: -10,
    attributes: {
      class: "leaflet-ruler-text",
    },
  };

  constructor(
    private map: L.Map,
    private page: PDFPage,
    private canvasWidth: number
  ) {
    this.init();
  }

  private getDist(layer: L.Polyline): string {
    const geo = layer.toGeoJSON();
    const coordinates = geo.geometry.coordinates as GeoJSON.Position[];

    if (coordinates.length !== 2) {
      return "0.0";
    }

    const pdfCoordinates = coordinates.map((coords) =>
      toPDFCoords(coords, this.page, this.canvasWidth)
    );

    const [x1, y1] = pdfCoordinates[0];
    const [x2, y2] = pdfCoordinates[1];
    const dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

    return dist.toFixed(1);
  }

  private init() {
    // TODO: Use actions and a shared "measurements" draw control
    this.map.pm.Toolbar.copyDrawControl("Line", {
      name: "Ruler",
      block: "draw",
      title: "Draw Ruler",
      className: "leaflet-ruler-icon",
      actions: ["cancel"],
    });

    this.map.on("pm:drawstart", ({ shape, workingLayer }) => {
      if (shape !== Ruler.SHAPE_NAME) {
        return;
      }

      const layer = workingLayer as L.Polyline;
      layer.on("pm:vertexadded", () => {
        if (layer.getLatLngs().length >= 2) {
          this.map.pm.Draw.Ruler._finishShape();
        }
      });

      layer.on("pm:change", () => {
        const hintline = this.map.pm.Draw.Ruler._hintline;
        hintline.setText(null);
        hintline.setText(this.getDist(hintline), Ruler.TEXT_OPTIONS);
        // hintline?.setAttribute("data-length", "19283");
      });
    });

    this.map.on(
      "pm:create",
      ({ shape, layer }: { shape: string; layer: L.Layer }) => {
        if (shape !== "Ruler") {
          return;
        }

        const polyline = layer as L.Polyline;
        polyline.setText(this.getDist(polyline), Ruler.TEXT_OPTIONS);
      }
    );

    this.map.pm.enableDraw(Ruler.SHAPE_NAME, {
      hideMiddleMarkers: true,
      allowSelfIntersection: false,
      // TODO: Add renderer
    });

    this.map.pm.disableDraw(Ruler.SHAPE_NAME);
  }
}
