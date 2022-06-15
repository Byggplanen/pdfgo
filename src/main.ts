import L from "leaflet";
import "leaflet-draw";

import PDFLayer from "./PDFLayer";
import "./style.css";

/// GLOBALS
let pdfLayer: PDFLayer;

/// ELEMENTS
const inputEl = document.querySelector<HTMLInputElement>("#pdf-input")!;

/// INIT
const map = L.map("map", {
  minZoom: 4,
  maxZoom: 16,
}).setView([40.697632, -98.461165], 4);

const drawnItems = new L.FeatureGroup().addTo(map);
const drawControl = new L.Control.Draw({
  edit: {
    featureGroup: drawnItems,
  },
});

map.addControl(drawControl);

// L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
//   attribution:
//     '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
// }).addTo(map);

/// HANDLERS
function onFileLoad(result: ArrayBuffer) {
  const typedArray = new Uint8Array(result);

  pdfLayer = new PDFLayer({
    pdf: typedArray,
    page: 1,
    minZoom: map.getMinZoom(),
    maxZoom: map.getMaxZoom(),
    bounds: new L.LatLngBounds(
      [-0.308849, -123.453116],
      [49.923578, -57.619317]
    ),
  }).addTo(map);

  // pdfLayer.bringToBack();
  // drawnItems.bringToFront();
}

function onFileChange() {
  if (pdfLayer && map.hasLayer(pdfLayer)) {
    map.removeLayer(pdfLayer);
  }

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

map.on(L.Draw.Event.CREATED, (e) => {
  // `.layer` is deprecated but `.propagatedFrom` does not work
  // with leaflet.draw
  drawnItems.addLayer(e.layer);
});
