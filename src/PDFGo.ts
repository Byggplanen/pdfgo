import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";

import PDFExporter, { GeomanLayer } from "./PDFExporter";
import PDFRenderer from "./PDFRenderer";
import { canvasOverlay, CanvasOverlay } from "./plugins/CanvasOverlay";
import { cloudPolygon } from "./plugins/CloudPolyline";
import Measurements from "./plugins/Measure";
import { CalibrateCallback } from "./plugins/Measure/Calibrate";
import PixelCRS from "./plugins/PixelCRS";

import "./PDFGo.css";

type PDFGoProps = {
  // Div element to render the viewer to
  element: HTMLDivElement;

  // Which page to render (starting at 1)
  // Default: 1
  pageNumber?: number;

  // Min zoom level
  // Default: -2
  minZoom?: number;

  // Max zoom level
  // Default: 2
  maxZoom?: number;

  // Initial zoom level
  // Default: -2
  zoom?: number;

  // The function that is called when the user performs a calibration
  onCalibrate?: CalibrateCallback;
};

export default class PDFGo {
  private map: L.Map;

  private pageNumber: number;

  private pdfRenderer?: PDFRenderer;

  private overlay?: CanvasOverlay;

  private measurements?: Measurements;

  private onCalibrate?: CalibrateCallback;

  // Width of canvas in map
  private canvasWidth: number = 0;

  // File (PDF) to render
  private file?: Uint8Array;

  // File name to save the PDF with
  private fileName?: string;

  constructor({
    element,
    pageNumber = 1,
    minZoom = -2,
    maxZoom = 2,
    zoom = -2,
    onCalibrate,
  }: PDFGoProps) {
    this.map = L.map(element, {
      zoom,
      minZoom,
      maxZoom,
      center: [0, 0],
      crs: PixelCRS,
    });
    this.pageNumber = pageNumber;
    this.onCalibrate = onCalibrate;
    this.initializeHandlers();
    this.initializeToolbar();
  }

  // Load the file in the typed array. `name` is the name that
  // the pdf should be saved with later.
  async loadFile(file: Uint8Array, name: string) {
    this.clearMap();
    this.file = file;
    this.fileName = name;

    // Initialize the canvas PDF renderer
    this.pdfRenderer = new PDFRenderer({
      file,
      pageNumber: this.pageNumber,
      minZoom: this.map.getMinZoom(),
    });

    // Render and draw the PDF to the leaflet map
    const canvas = await this.pdfRenderer.renderPage(this.map.getZoom());
    const bounds: L.LatLngBoundsExpression = [
      [0, 0],
      [canvas.height, canvas.width],
    ];
    this.overlay = canvasOverlay(canvas, L.latLngBounds(bounds)).addTo(
      this.map
    );
    this.map.setView([canvas.height / 2, canvas.width / 2]);
    this.canvasWidth = canvas.width;

    // Initialize the measurement tools
    const { width, height } = await this.pdfRenderer.getBoundaries();
    this.measurements?.updateDimensions(width, height, canvas.width);
  }

  // Download the pdf with all annotations.
  async downloadPdf() {
    if (!this.file || !this.fileName) {
      throw new Error("Cannot download PDF before PDF has been loaded");
    }

    const exporter = new PDFExporter({
      file: this.file,
      name: this.fileName,
      canvasWidth: this.canvasWidth,
    });

    const layers = this.map.pm.getGeomanLayers() as GeomanLayer[];
    await exporter.drawLayers(layers, this.pageNumber - 1);
    await exporter.downloadPdf();
  }

  // Adjust the scale of the loaded PDF.
  //
  // `length` is the value passed to `onCalibrate` (a length in points)
  // and `actualLength` should be a string suffixed with ft or m without
  // any spaces. E:g., 23ft or 8m.
  adjustScale(length: number, actualLength: string) {
    this.measurements?.adjustScale(length, actualLength);
  }

  private clearMap() {
    this.map.eachLayer((layer) => this.map.removeLayer(layer));
  }

  private initializeHandlers() {
    this.map.on("zoomend", this.onZoom, this);
  }

  private initializeToolbar() {
    this.map.pm.addControls({
      position: "topleft",
      drawCircleMarker: false,
      cutPolygon: false,
    });

    this.map.pm.setGlobalOptions({
      allowSelfIntersection: false,
    });

    // Cloud polyline button
    cloudPolygon(this.map);

    // Ruler, Calibrate and Area are all placed in the "custom" block
    // and hidden so we can trigger them from the Measurements actions
    // without showing another button in the toolbar
    this.map.pm.addControls({
      customControls: false,
    });

    this.measurements = new Measurements(this.map, this.onCalibrate);
  }

  private async onZoom() {
    // Cannot handle zoom before PDF has been loaded
    if (!this.overlay || !this.pdfRenderer) {
      return;
    }

    const canvas = await this.pdfRenderer.renderPage(this.map.getZoom());
    this.overlay.setCanvas(canvas);
  }
}
