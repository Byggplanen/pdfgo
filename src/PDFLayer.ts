// https://github.com/kurtraschke/L.GridLayer.PDFLayer

import L from "leaflet";
import * as PDFJS from "pdfjs-dist";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

PDFJS.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const rescaleCanvas = (ctx: CanvasRenderingContext2D) => {
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
};

const computeScale = (
  page: PDFJS.PDFPageProxy,
  map: L.Map,
  layerBounds: L.LatLngBounds,
  zoom: number
) => {
  const viewport = page.getViewport({ scale: 1 });
  const [pageMinX, pageMinY, pageMaxX, pageMaxY] = viewport.viewBox;

  const sw = map.project(layerBounds.getSouthWest(), zoom);
  const ne = map.project(layerBounds.getNorthEast(), zoom);

  const [layerMinX, layerMinY, layerMaxX, layerMaxY] = [sw.x, sw.y, ne.x, ne.y];

  const xScale =
    Math.abs(layerMaxX - layerMinX) / Math.abs(pageMaxX - pageMinX);
  const yScale =
    Math.abs(layerMaxY - layerMinY) / Math.abs(pageMaxY - pageMinY);
  const scale = Math.min(xScale, yScale);

  return scale;
};

const parent = (tile: L.Coords) => {
  const x = Math.floor(tile.x / 2);
  const y = Math.floor(tile.y / 2);
  const z = tile.z - 1;
  const parentTile = new L.Point(x, y);
  (parentTile as L.Coords).z = z;
  return parentTile as L.Coords;
};

const children = (tile: L.Coords) => {
  const newChildren: L.Coords[] = [];
  for (let i = 2 * tile.x; i < 2 * tile.x + 2; i += 1) {
    for (let j = 2 * tile.y; j < 2 * tile.y + 2; j += 1) {
      const childTile = new L.Point(i, j);
      (childTile as L.Coords).z = tile.z + 1;
      newChildren.push(childTile as L.Coords);
    }
  }
  return newChildren;
};

const PDFLayer = L.GridLayer.extend({
  _metatileCanvases: {},

  async _getMetatileCanvas(key: string) {
    if (this._metatileCanvases[key]) {
      return this._metatileCanvases[key];
    }

    const page: PDFJS.PDFPageProxy = await this._pagePromise;

    const mtCoords = this._keyToTileCoords(key);
    const mtBounds = L.latLngBounds(
      children(mtCoords)
        .flatMap((tile) => children(tile))
        .map((tile) => this._tileCoordsToBounds(tile))
    );

    const zoom = mtCoords.z + 2;

    // We use a pixel coordinate system, not cartesian, so y is inverted
    const layerBoundsTopLeft = this._map.project(
      this.options.bounds.getSouthWest(),
      zoom
    );
    const tileTopLeft = this._map.project(mtBounds.getSouthWest(), zoom);
    const tileBottomRight = this._map.project(mtBounds.getNorthEast(), zoom);

    const canvas = L.DomUtil.create("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = tileBottomRight.x - tileTopLeft.x;
    canvas.height = tileBottomRight.y - tileTopLeft.y;

    rescaleCanvas(ctx);

    const viewport = page.getViewport({
      scale: computeScale(page, this._map, this.options.bounds, zoom),
      offsetX: -1 * (tileTopLeft.x - layerBoundsTopLeft.x),
      offsetY: -1 * (tileTopLeft.y - layerBoundsTopLeft.y),
    });

    await page.render({
      intent: "print",
      background: "transparent",
      canvasContext: ctx,
      viewport,
    }).promise;

    this._metatileCanvases[key] = canvas;
    return canvas;
  },

  async _drawTile(
    tile: HTMLCanvasElement,
    coords: L.Coords,
    done: L.DoneCallback
  ) {
    const size = this.getTileSize();
    const ctx = tile.getContext("2d")!;

    rescaleCanvas(ctx);

    const metatileCanvas = await this._getMetatileCanvas(
      this._tileCoordsToKey(parent(parent(coords)))
    ).catch((error: any) => {
      console.error(error);
      done(error);
    });

    const { width: sourceWidth, height: sourceHeight } = tile;
    const sourceX = (coords.x % 4) * sourceWidth;
    const sourceY = (coords.y % 4) * sourceHeight;

    const destX = 0;
    const destY = 0;
    const { x: destWidth, y: destHeight } = size;

    ctx.drawImage(
      metatileCanvas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );

    done(undefined, tile);
  },

  createTile(coords: L.Coords, done: L.DoneCallback) {
    const tile = L.DomUtil.create("canvas", "leaflet-tile");
    const size = this.getTileSize();
    tile.width = size.x;
    tile.height = size.y;

    this._drawTile(tile, coords, done);
    return tile;
  },
});

PDFLayer.addInitHook(function initHook(this: any) {
  const { pdf: pdfData } = this.options;
  const { page } = this.options;
  this._documentPromise = PDFJS.getDocument(pdfData).promise;
  this._pagePromise = this._documentPromise.then(
    (pdf: PDFJS.PDFDocumentProxy) => pdf.getPage(page)
  );
});

function pdfLayer(
  options: { pdf: Uint8Array; page: number } & L.GridLayerOptions
) {
  // @ts-ignore
  return new PDFLayer(options);
  // @ts-enable
}

export default pdfLayer;
