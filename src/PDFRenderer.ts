import * as PDFJS from "pdfjs-dist";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

PDFJS.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default class PDFRenderer {
  private pdf: Promise<PDFJS.PDFDocumentProxy>;

  constructor(file: Uint8Array) {
    this.pdf = PDFJS.getDocument(file).promise;
  }

  static rescaleCanvas(ctx: CanvasRenderingContext2D) {
    const devicePixelRatio = window.devicePixelRatio || 1;

    if (devicePixelRatio !== 1) {
      const oldWidth = ctx.canvas.width;
      const oldHeight = ctx.canvas.height;

      ctx.canvas.width = oldWidth * devicePixelRatio;
      ctx.canvas.height = oldHeight * devicePixelRatio;

      ctx.canvas.style.width = `${oldWidth}px`;
      ctx.canvas.style.height = `${oldHeight}px`;

      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
  }

  async renderPage(
    pageNumber: number
  ): Promise<[string, number, number]> {
    // Should give a reasonable DPI for zooming in
    const width = window.screen.availWidth;

    const pdf = await this.pdf;
    const page = await pdf.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: width / base.width });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    PDFRenderer.rescaleCanvas(ctx);

    const renderContext = {
      intent: "print",
      background: "transparent",
      canvasContext: ctx,
      viewport,
    };

    await page.render(renderContext).promise;
    return [canvas.toDataURL("image/png"), canvas.width, canvas.height];
  }
}
