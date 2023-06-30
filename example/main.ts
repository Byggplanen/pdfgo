import PDFGo from "../src";

import "./style.css";

/// CONSTANTS
const ACTUAL_LENGTH = "20m";

/// ELEMENTS
const map = document.querySelector<HTMLDivElement>("#map")!;
const inputEl = document.querySelector<HTMLInputElement>("#pdf-input")!;
 const json1= '[{"type":"Circle","options":{"color":"#3388ff","radius":206.18438350175796,"pane":"overlayPane"},"renderer":null,"shape":{},"latLngs":{"lat":508,"lng":392}},{"type":"Circle","options":{"color":"#3388ff","radius":258.549801779077,"pane":"overlayPane"},"renderer":null,"shape":{},"latLngs":{"lat":480,"lng":884}}]';

// GLOBALS
const pdfGo = new PDFGo({
  element: map,
  onCalibrate: (length: number) => {
    pdfGo.adjustScale(length, ACTUAL_LENGTH);
  },
  saveSettings: {
    download: false,
    onClick: function () {
      console.log(pdfGo.getJSON())
      console.log(pdfGo.isChanged())
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
     pdfGo.importFromJSON(json1);
  };
  fileReader.readAsArrayBuffer(file);
}

/// EVENT LISTENERS
inputEl.addEventListener("change", onFileChange);
