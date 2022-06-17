import * as PDFJS from "pdfjs-dist";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

PDFJS.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type PDFRendererProps = {
  file: Uint8Array;
  pageNumber: number;
  minZoom: number;
};

export default class PDFRenderer {
  // Promise for loaded pdf
  private pdf: Promise<PDFJS.PDFDocumentProxy>;

  // Previously created canvases with the pdf already rendered
  private canvasByZoom: Record<number, HTMLCanvasElement> = {};

  // PDF page number
  private pageNumber: number;

  // Lower bound zoom
  private minZoom: number;

  constructor({ file, pageNumber, minZoom }: PDFRendererProps) {
    this.pdf = PDFJS.getDocument(file).promise;
    this.pageNumber = pageNumber;
    this.minZoom = minZoom;
  }

  getRenderWidth(zoom: number) {
    const normalizedZoom = zoom - this.minZoom + 1;
    return window.screen.availWidth * normalizedZoom;
  }

  async renderPage(zoom: number): Promise<HTMLCanvasElement> {
    if (zoom in this.canvasByZoom) {
      return this.canvasByZoom[zoom];
    }

    const canvas = document.createElement("canvas");
    await this.renderToCanvas(zoom, canvas);

    this.canvasByZoom[zoom] = canvas;
    return canvas;
  }

  async renderToCanvas(zoom: number, canvas: HTMLCanvasElement): Promise<void> {
    const ctx = canvas.getContext("2d")!;
    const width = this.getRenderWidth(zoom);
    const pdf = await this.pdf;
    const page = await pdf.getPage(this.pageNumber);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: width / base.width });

    /* eslint-disable no-param-reassign */
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    /* eslint-enable no-param-reassign */

    const renderContext = {
      intent: "print",
      background: "transparent",
      canvasContext: ctx,
      viewport,
    };

    return page.render(renderContext).promise;
  }
}
