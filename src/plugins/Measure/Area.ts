import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import { PDFPage } from "pdf-lib";
import throttle from "lodash/throttle";

import { toPDFCoords } from "../units";

export default class Area {
  static readonly SHAPE_NAME = "Area";

  static readonly THROTTLE_MS = 100;

  static readonly TOOLTIP_OPTIONS: L.TooltipOptions = {
    permanent: true,
    direction: "center",
    className: "leaflet-area-text",
  };

  // Show "Uncalibrated" text when undefined
  private unit?: string;

  // Scale factor for the sides of the polygon, not the area
  private scaleFactor: number = 1;

  // Also contains layers that have been removed
  private layers: L.Polygon[] = [];

  constructor(
    private map: L.Map,
    private page: PDFPage,
    private canvasWidth: number
  ) {
    this.init();
  }

  private init() {
    this.map.pm.Toolbar.copyDrawControl("Polygon", {
      name: Area.SHAPE_NAME,
      block: "custom",
    });
  }

  enable() {
    this.map.on("pm:create", this.handleCreateShape, this);
    this.map.on("pm:drawend", this.deactivate, this);

    this.map.pm.enableDraw(Area.SHAPE_NAME, {
      allowSelfIntersection: false,
    });
  }

  updateScale(scaleFactor: number, unit: string) {
    this.scaleFactor = scaleFactor;
    this.unit = unit;
    for (const layer of this.layers) {
      layer.bindTooltip(this.getArea(layer), Area.TOOLTIP_OPTIONS);
    }
  }

  deactivate() {
    this.map.off("pm:create", this.handleCreateShape, this);
    this.map.off("pm:drawend", this.deactivate, this);
  }

  protected handleCreateShape({
    layer,
  }: {
    shape: string;
    layer: L.Layer;
  }): void {
    const polygon = layer as L.Polygon;
    polygon.bindTooltip(this.getArea(polygon), Area.TOOLTIP_OPTIONS);

    polygon.on(
      "pm:change",
      throttle(() => {
        polygon.bindTooltip(this.getArea(polygon), Area.TOOLTIP_OPTIONS);
      }, Area.THROTTLE_MS)
    );

    this.layers.push(polygon);
  }

  // Only supports simple polygons. No cuts and no overlapping.
  // https://en.wikipedia.org/wiki/Shoelace_formula
  private getArea(layer: L.Polygon): string {
    if (!this.unit) {
      return "Uncalibrated";
    }

    const geo = layer.toGeoJSON();
    const coordinates = geo.geometry.coordinates as GeoJSON.Position[][];

    const pdfCoordinates = coordinates.flatMap((ring) =>
      ring.map((coords) => toPDFCoords(coords, this.page, this.canvasWidth))
    );

    let total: number = 0;
    for (let i = 0; i < pdfCoordinates.length; i += 1) {
      const [x1, y1] = pdfCoordinates[i];
      const [x2, y2] = pdfCoordinates[(i + 1) % pdfCoordinates.length];
      total += x1 * y2 - x2 * y1;
    }

    total = (this.scaleFactor ** 2 * Math.abs(total)) / 2;
    return `${total.toFixed(1)} ${this.unit}²`;
  }
}
