import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";

import canvasOverlay, { CanvasOverlay } from "./CanvasOverlay";
import PDFRenderer from "./PDFRenderer";
import PixelCRS from "./PixelCRS";
import PDFExporter, { GeomanLayer } from "./PDFExporter";

import "./style.css";

/// CONSTANTS
const PAGE_NUMBER = 1;

/// GLOBALS
let renderer: PDFRenderer;
let exporter: PDFExporter;
let overlay: CanvasOverlay;

/// ELEMENTS
const inputEl = document.querySelector<HTMLInputElement>("#pdf-input")!;
const downloadBtn = document.querySelector<HTMLButtonElement>("#download-btn")!;

/// INIT
const map = L.map("map", {
  zoom: -2,
  minZoom: -2,
  maxZoom: 2,
  crs: PixelCRS,
});

/// HANDLERS
async function onZoom() {
  if (!overlay) {
    return;
  }

  const canvas = await renderer.renderPage(map.getZoom());
  overlay.setCanvas(canvas);
}

async function onFileLoad(result: ArrayBuffer, name: string) {
  const typedArray = new Uint8Array(result);

  renderer = new PDFRenderer({
    file: typedArray,
    pageNumber: PAGE_NUMBER,
    minZoom: map.getMinZoom(),
  });

  const canvas = await renderer.renderPage(map.getZoom());
  const bounds: L.LatLngBoundsExpression = [
    [0, 0],
    [canvas.height, canvas.width],
  ];

  overlay = canvasOverlay(canvas, L.latLngBounds(bounds)).addTo(map);
  exporter = new PDFExporter({
    file: typedArray,
    name,
    canvasWidth: canvas.width,
  });

  map.setView([canvas.height / 2, canvas.width / 2]);
  map.pm.addControls({
    position: "topleft",
    drawCircleMarker: false,
    cutPolygon: false,
  });
}

function onFileChange() {
  const file = inputEl.files?.[0];
  if (!file) {
    return;
  }

  const fileReader = new FileReader();
  fileReader.onload = function handleLoad() {
    onFileLoad(this.result as ArrayBufferLike, file.name);
  };
  fileReader.readAsArrayBuffer(file);
}

async function onDownloadClick() {
  if (!exporter) {
    return;
  }

  const layers = map.pm.getGeomanLayers() as GeomanLayer[];
  await exporter.drawLayers(layers, PAGE_NUMBER - 1);
  // await exporter.downloadPdf();
}

/// EVENT LISTENERS
inputEl.addEventListener("change", onFileChange);
downloadBtn.addEventListener("click", onDownloadClick);
map.on("zoomend", onZoom);
