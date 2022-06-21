import L from "leaflet";

type CanvasOverlayType = L.Layer & {
  setCanvas(canvas: HTMLCanvasElement): void;
  getBounds(): L.LatLngBounds;
};

// Layer that overlays the given canvas, inspired by L.imageOverlay
const CanvasOverlay = L.Layer.extend({
  initialize(canvas: HTMLCanvasElement, bounds: L.LatLngBounds) {
    this._container = L.DomUtil.create("div");
    this._canvas = canvas;
    this._container.appendChild(this._canvas);
    this._bounds = bounds;
    this._initContainer();
    this._initCanvas();
  },

  onAdd() {
    this.getPane().appendChild(this._container);
    this._reset();
  },

  onRemove() {
    L.DomUtil.remove(this._container);
  },

  getEvents() {
    return {
      zoom: this._reset,
      viewreset: this._reset,
      zoomanim: this._animateZoom,
    };
  },

  setCanvas(canvas: HTMLCanvasElement) {
    L.DomUtil.remove(this._canvas);
    this._container.appendChild(canvas);
    this._canvas = canvas;
    this._initCanvas();
  },

  getBounds() {
    return this._bounds;
  },

  _animateZoom(e: L.ZoomAnimEvent) {
    const scale = this._map.getZoomScale(e.zoom);
    const offset = this._map._latLngBoundsToNewLayerBounds(
      this._bounds,
      e.zoom,
      e.center
    ).min;

    L.DomUtil.setTransform(this._container, offset, scale);
  },

  _reset() {
    const container = this._container;
    const bounds = new L.Bounds(
      this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
      this._map.latLngToLayerPoint(this._bounds.getSouthEast())
    );
    const size = bounds.getSize();

    L.DomUtil.setPosition(container, bounds.min!);

    container.style.width = `${size.x}px`;
    container.style.height = `${size.y}px`;
  },

  _initCanvas() {
    const canvas = this._canvas;

    L.DomUtil.addClass(canvas, "leaflet-canvas-overlay");
  },

  _initContainer() {
    const container = this._container;

    // position: absolute, top: 0, left: 0
    L.DomUtil.addClass(container, "leaflet-canvas-container");

    L.DomUtil.addClass(container, "leaflet-zoom-animated");
  },
});

function canvasOverlay(
  canvas: HTMLCanvasElement,
  bounds: L.LatLngBounds
): CanvasOverlayType {
  // @ts-ignore
  return new CanvasOverlay(canvas, bounds);
  // @ts-enable
}

export type { CanvasOverlayType as CanvasOverlay };

export default canvasOverlay;
