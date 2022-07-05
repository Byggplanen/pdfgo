declare type PDFRendererProps = {
    file: Uint8Array;
    pageNumber: number;
    minZoom: number;
};
export default class PDFRenderer {
    private pdf;
    private canvasByZoom;
    private pageNumber;
    private minZoom;
    constructor({ file, pageNumber, minZoom }: PDFRendererProps);
    getBoundaries(): Promise<{
        width: number;
        height: number;
    }>;
    renderPage(zoom: number): Promise<HTMLCanvasElement>;
    renderToCanvas(zoom: number, canvas: HTMLCanvasElement): Promise<void>;
    private getRenderWidth;
}
export {};
//# sourceMappingURL=PDFRenderer.d.ts.map