import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";

import canvasOverlay, { CanvasOverlay } from "./CanvasOverlay";
import PDFRenderer from "./PDFRenderer";
import PixelCRS from "./PixelCRS";
import DebugLayer from "./DebugLayer";

import "./style.css";

/// GLOBALS
let renderer: PDFRenderer;
let overlay: CanvasOverlay;

/// ELEMENTS
const inputEl = document.querySelector<HTMLInputElement>("#pdf-input")!;

/// INIT
const map = L.map("map", {
  zoom: -2,
  minZoom: -2,
  maxZoom: 2,
  crs: PixelCRS,
});

map.addLayer(DebugLayer());

map.pm.addControls({
  position: "topleft",
});

/// HANDLERS
async function onZoom() {
  if (!overlay) {
    return;
  }

  const canvas = await renderer.renderPage(map.getZoom());
  overlay.setCanvas(canvas);
}

async function onFileLoad(result: ArrayBuffer) {
  const typedArray = new Uint8Array(result);

  renderer = new PDFRenderer({
    file: typedArray,
    pageNumber: 1,
    minZoom: map.getMinZoom(),
  });

  const canvas = await renderer.renderPage(map.getZoom());
  const bounds: L.LatLngBoundsExpression = [
    [0, 0],
    [canvas.height, canvas.width],
  ];

  overlay = canvasOverlay(canvas, L.latLngBounds(bounds)).addTo(map);

  map.setView([canvas.height / 2, canvas.width / 2]);
}

function onFileChange() {
  const file = inputEl.files?.[0];
  if (!file) {
    return;
  }

  const fileReader = new FileReader();
  fileReader.onload = function handleLoad() {
    onFileLoad(this.result as ArrayBufferLike);
  };
  fileReader.readAsArrayBuffer(file);
}

/// EVENT LISTENERS
inputEl.addEventListener("change", onFileChange);
map.on("zoomend", onZoom);
