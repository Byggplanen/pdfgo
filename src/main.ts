import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";

import PDFLayer from "./PDFLayer";
import PixelCRS from "./PixelCRS";

import "./style.css";

/// GLOBALS
let pdfLayer: L.GridLayer;

/// ELEMENTS
const inputEl = document.querySelector<HTMLInputElement>("#pdf-input")!;

/// INIT
const map = L.map("map", {
  minZoom: 0,
  maxZoom: 5,
  crs: PixelCRS,
}).setView([250, 250], 0);

map.pm.addControls({
  position: "topleft",
});

/// HANDLERS
async function onFileLoad(result: ArrayBuffer) {
  const typedArray = new Uint8Array(result);

  pdfLayer = PDFLayer({
    pdf: typedArray,
    page: 1,
    bounds: new L.LatLngBounds([0, 500], [500, 0]),
  });

  pdfLayer.addTo(map).bringToFront();
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
inputEl.addEventListener("change", () => {
  onFileChange();
});
