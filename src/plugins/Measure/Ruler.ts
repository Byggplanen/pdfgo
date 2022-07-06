import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "leaflet-textpath";
import throttle from "lodash/throttle";

import { toPDFCoords } from "../units";
import { ArrowRenderer, arrowRenderer } from "./ArrowRenderer";

export default class Ruler {
  static readonly THROTTLE_MS = 100;

  static readonly TEXT_OPTIONS: L.TextPathOptions = {
    center: true,
    offset: -10,
    attributes: {
      class: "leaflet-ruler-text",
    },
  };

  private arrowRenderer: ArrowRenderer;

  // Show "Uncalibrated" text when undefined
  protected unit?: string;

  private scaleFactor: number = 1;

  // Also contains layers that have been removed
  private layers: L.Polyline[] = [];

  private pageWidth: number = 0;

  private pageHeight: number = 0;

  private canvasWidth: number = 0;

  constructor(private map: L.Map) {
    this.arrowRenderer = arrowRenderer();
    this.init();
  }

  updateDimensions(pageWidth: number, pageHeight: number, canvasWidth: number) {
    this.pageWidth = pageWidth;
    this.pageHeight = pageHeight;
    this.canvasWidth = canvasWidth;
  }

  protected init() {
    if (this.map.pm.Toolbar.getControlOrder().includes(this.shape_name())) {
      return;
    }

    this.map.pm.Toolbar.copyDrawControl("Line", {
      name: this.shape_name(),
      block: "custom",
    });
  }

  // eslint-disable-next-line class-methods-use-this
  protected shape_name(): string {
    return "Ruler";
  }

  enable() {
    this.map.on("pm:drawstart", this.handleDrawStart, this);
    this.map.on("pm:create", this.handleCreateShape, this);
    this.map.on("pm:drawend", this.deactivate, this);

    this.map.pm.enableDraw(this.shape_name(), {
      pathOptions: { color: "red", renderer: this.arrowRenderer },
      hintlineStyle: { color: "#3388ff", renderer: this.arrowRenderer },
      templineStyle: { renderer: this.arrowRenderer },
      hideMiddleMarkers: true,
      allowSelfIntersection: false,
    });
  }

  updateScale(scaleFactor: number, unit: string) {
    this.scaleFactor = scaleFactor;
    this.unit = unit;
    for (const layer of this.layers) {
      if (this.map.hasLayer(layer)) {
        layer.setText(null);
        layer.setText(this.getFormattedDist(layer), Ruler.TEXT_OPTIONS);
      }
    }
  }

  deactivate() {
    this.map.off("pm:drawstart", this.handleDrawStart, this);
    this.map.off("pm:create", this.handleCreateShape, this);
    this.map.off("pm:drawend", this.deactivate, this);
  }

  protected handleCreateShape({
    layer,
  }: {
    shape: string;
    layer: L.Layer;
  }): void {
    const polyline = layer as L.Polyline;
    polyline.setText(this.getFormattedDist(polyline), Ruler.TEXT_OPTIONS);

    polyline.on(
      "pm:change",
      throttle(() => {
        polyline.setText(null);
        polyline.setText(this.getFormattedDist(polyline), Ruler.TEXT_OPTIONS);
      }, Ruler.THROTTLE_MS)
    );

    this.layers.push(polyline);
  }

  private handleDrawStart({
    workingLayer,
  }: {
    shape: string;
    workingLayer: L.Layer;
  }) {
    const layer = workingLayer as L.Polyline;
    layer.on("pm:vertexadded", () => {
      if (layer.getLatLngs().length >= 2) {
        this.map.pm.Draw[this.shape_name()]._finishShape();
      }
    });

    layer.on(
      "pm:change",
      throttle(() => {
        const hintline = this.map.pm.Draw[this.shape_name()]._hintline;
        hintline.setText(null);
        hintline.setText(this.getFormattedDist(hintline), Ruler.TEXT_OPTIONS);
      }, Ruler.THROTTLE_MS)
    );
  }

  protected getPointDist(layer: L.Polyline): number {
    const geo = layer.toGeoJSON();
    const coordinates = geo.geometry.coordinates as GeoJSON.Position[];

    if (coordinates.length !== 2) {
      return 0;
    }

    const pdfCoordinates = coordinates.map((coords) =>
      toPDFCoords(coords, this.pageWidth, this.pageHeight, this.canvasWidth)
    );

    const [x1, y1] = pdfCoordinates[0];
    const [x2, y2] = pdfCoordinates[1];
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  protected getFormattedDist(layer: L.Polyline): string {
    if (!this.unit) {
      return "Uncalibrated";
    }

    const dist = this.getPointDist(layer) * this.scaleFactor;
    return `${dist.toFixed(1)} ${this.unit}`;
  }
}
