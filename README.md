# pdfgo.js
A drop-in PDF annotator and markups for the browser.

![image](https://github.com/Byggplanen/pdf-draw/assets/47240703/4780c156-b052-4588-be30-aec694a3d966)

## usage
Import the CSS:
```css
@import "pdfgo/dist/style.css";
```

In JS/TS:
```js
import PDFGo from "pdfgo";

const div = document.querySelector("#app");
const pdfgo = new PDFGo(div);

// Load a PDF
const file = new Uint8Array(...);
const name = "edited.pdf";
await pdfgo.loadFile(file, name);

// Download the PDF
await pdfgo.downloadPdf();

// ...or get the bytes
const bytes = await pdfgo.savePdf();

// Destroy the annotator when done
pdfgo.destroy();
```

## todo
- remove experimental/unused code
- support for changing colors (not necessarily GUI)
- improve enable/disable/toggle behavior of measurements toolbar button

## resources
- https://github.com/Lanseria/vue-pdf-useinvite
- extracting figures from geoman
  - https://github.com/geoman-io/leaflet-geoman/discussions/856
  - https://jsfiddle.net/falkedesign/4fycojbu/
- leaflet plugin in ts
  - https://github.com/slutske22/leaflet-spline/blob/main/src/index.ts
