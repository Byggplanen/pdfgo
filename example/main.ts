import PDFGo from "../src";

import "./style.css";

/// CONSTANTS
const ACTUAL_LENGTH = "20m";

/// ELEMENTS
const map = document.querySelector<HTMLDivElement>("#map")!;
const inputEl = document.querySelector<HTMLInputElement>("#pdf-input")!;
const exampleJSON = '[{"type":"Polyline","options":{"renderer":"CloudPolylineRenderer","color":"#3388ff","pane":"overlayPane"},"latLngs":[[{"lat":976,"lng":-44},{"lat":1404,"lng":-852},{"lat":716,"lng":-840},{"lat":316,"lng":-212}]]},{"type":"Polygon","options":{"renderer":"CloudPolylineRenderer","color":"#3388ff","pane":"overlayPane"},"latLngs":[[{"lat":976,"lng":-44},{"lat":1404,"lng":-852},{"lat":716,"lng":-840},{"lat":316,"lng":-212}]]},{"type":"Circle","options":{"color":"#3388ff","radius":854.6157031087131,"pane":"overlayPane"},"latLngs":{"lat":1624,"lng":1852}},{"type":"Circlemarker","options":{"color":"#3388ff","radius":854.6157031087131,"pane":"overlayPane"},"latLngs":{"lat":1624,"lng":1852}}]';

// GLOBALS
const pdfGo = new PDFGo({
  element: map,
  onCalibrate: (length: number) => {
    pdfGo.adjustScale(length, ACTUAL_LENGTH);
  },
  saveSettings: {
    onClick: () => {
      console.log(pdfGo.getGeoJSON())
      return Promise.resolve()
    }
  },
});

function onFileChange() {
  const file = inputEl.files?.[0];
  if (!file) {
    return;
  }

  const fileReader = new FileReader();
  fileReader.onload = function handleLoad() {
    const typedArray = new Uint8Array(this.result as ArrayBufferLike);
    pdfGo.loadFile(typedArray, file.name);
    pdfGo.importFromJSON(exampleJSON);
  };
  fileReader.readAsArrayBuffer(file);
}

/// EVENT LISTENERS
inputEl.addEventListener("change", onFileChange);
