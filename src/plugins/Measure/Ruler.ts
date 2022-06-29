import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "leaflet-textpath";
import { PDFPage } from "pdf-lib";
import throttle from "lodash/throttle";

import { toPDFCoords } from "../units";

export default class Ruler {
  static readonly THROTTLE_MS = 100;

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

  protected init() {
    console.log(this.shape_name());
    this.map.pm.Toolbar.copyDrawControl("Line", {
      name: this.shape_name(),
      block: "custom",
    });
  }

  // eslint-disable-next-line class-methods-use-this
  protected shape_name(): string {
    return "Ruler";
  }

  activate() {
    this.map.on("pm:drawstart", this.handleDrawStart, this);
    this.map.on("pm:create", this.handleCreateShape, this);
    this.map.on("pm:drawend", this.handleDisable, this);

    console.log(this.shape_name());
    this.map.pm.enableDraw(this.shape_name(), {
      hideMiddleMarkers: true,
      allowSelfIntersection: false,
      editable: false,
      // TODO: Add renderer
    });

    // Hide the button
    this.map.pm.Toolbar.setButtonDisabled(this.shape_name(), true);
  }

  private handleDisable() {
    console.log("Disabled", this.shape_name());
    this.map.off("pm:drawstart", this.handleDrawStart, this);
    this.map.off("pm:create", this.handleCreateShape, this);
    this.map.off("pm:drawend", this.handleDisable, this);
  }

  protected handleCreateShape({
    layer,
  }: {
    shape: string;
    layer: L.Layer;
  }): void {
    const polyline = layer as L.Polyline;
    polyline.setText(this.getDist(polyline), Ruler.TEXT_OPTIONS);

    polyline.on(
      "pm:change",
      throttle(() => {
        polyline.setText(null);
        polyline.setText(this.getDist(polyline), Ruler.TEXT_OPTIONS);
      }, Ruler.THROTTLE_MS)
    );
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
        hintline.setText(this.getDist(hintline), Ruler.TEXT_OPTIONS);
      }, Ruler.THROTTLE_MS)
    );
  }

  protected getDist(layer: L.Polyline): string {
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
}
