# pdf-draw
A drop-in PDF annotator for the browser.

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
