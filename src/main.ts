import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";

// import PDFLayer from "./PDFLayer";
// import DebugLayer from "./DebugLayer";
import PDFRenderer from "./PDFRenderer";
import "./style.css";

/// GLOBALS
let pdfLayer: L.GridLayer;

/// ELEMENTS
const inputEl = document.querySelector<HTMLInputElement>("#pdf-input")!;

/// INIT
const map = L.map("map", {
  center: [0, 0],
  zoom: 0,
  minZoom: -3,
  maxZoom: 5,
  crs: L.CRS.Simple,
});

map.pm.addControls({
  position: "topleft",
});

// map.addLayer(DebugLayer());

/// HANDLERS
async function onFileLoad(result: ArrayBuffer) {
  const typedArray = new Uint8Array(result);

  if (pdfLayer && map.hasLayer(pdfLayer)) {
    // TODO: Does not seem to work
    map.removeLayer(pdfLayer);
  }

  // pdfLayer = PDFLayer({
  //   pdf: typedArray,
  //   page: 1,
  //   minZoom: map.getMinZoom(),
  //   maxZoom: map.getMaxZoom(),
  //   bounds: new L.LatLngBounds([0, 0], [1000, 1000]),
  // }).addTo(map);

  // pdfLayer.bringToBack();

  const renderer = new PDFRenderer(typedArray);
  const [imageUrl, width, height] = await renderer.renderPage(1);
  const bounds: L.LatLngBoundsExpression = [
    [0, 0],
    [height, width],
  ];

  L.imageOverlay(imageUrl, bounds).addTo(map);
  map.fitBounds(bounds);
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
