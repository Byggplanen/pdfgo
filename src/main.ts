import PDFGo from "./PDFGo";

/// CONSTANTS
const ACTUAL_LENGTH = "20m";

/// ELEMENTS
const map = document.querySelector<HTMLDivElement>("#map")!;
const inputEl = document.querySelector<HTMLInputElement>("#pdf-input")!;
const downloadBtn = document.querySelector<HTMLButtonElement>("#download-btn")!;

// GLOBALS
const pdfGo = new PDFGo({
  element: map,
  onCalibrate: (length: number) => {
    pdfGo.adjustScale(length, ACTUAL_LENGTH);
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
  };
  fileReader.readAsArrayBuffer(file);
}

/// EVENT LISTENERS
inputEl.addEventListener("change", onFileChange);
downloadBtn.addEventListener("click", () => {
  pdfGo.downloadPdf();
});
