import L from "leaflet";

// Layer that overlays the given canvas, inspired by L.imageOverlay
export class CanvasOverlay extends L.Layer {
  _container: HTMLDivElement;

  _canvas: HTMLCanvasElement;

  _bounds: L.LatLngBounds;

  constructor(
    canvas: HTMLCanvasElement,
    bounds: L.LatLngBounds,
    options?: L.LayerOptions
  ) {
    super(options);

    this._container = L.DomUtil.create("div");
    this._canvas = canvas;
    this._container.appendChild(this._canvas);
    this._bounds = bounds;
    this._initContainer();
    this._initCanvas();
  }

  onAdd() {
    this.getPane()!.appendChild(this._container);
    this._reset();
    return this;
  }

  onRemove() {
    L.DomUtil.remove(this._container);
    return this;
  }

  getEvents() {
    return {
      zoom: this._reset,
      viewreset: this._reset,
      zoomanim: this._animateZoom,
    };
  }

  setCanvas(canvas: HTMLCanvasElement) {
    L.DomUtil.remove(this._canvas);
    this._container.appendChild(canvas);
    this._canvas = canvas;
    this._initCanvas();
  }

  getBounds() {
    return this._bounds;
  }

  _animateZoom(e: L.LeafletEvent) {
    const event = e as L.ZoomAnimEvent;
    const scale = this._map.getZoomScale(event.zoom);
    const offset = this._map._latLngBoundsToNewLayerBounds(
      this._bounds,
      event.zoom,
      event.center
    ).min;

    L.DomUtil.setTransform(this._container, offset!, scale);
  }

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
  }

  _initCanvas() {
    const canvas = this._canvas;

    L.DomUtil.addClass(canvas, "leaflet-canvas-overlay");
  }

  _initContainer() {
    const container = this._container;

    L.DomUtil.addClass(container, "leaflet-canvas-container");
    L.DomUtil.addClass(container, "leaflet-zoom-animated");
  }
}

export function canvasOverlay(
  canvas: HTMLCanvasElement,
  bounds: L.LatLngBounds,
  options?: L.LayerOptions
) {
  return new CanvasOverlay(canvas, bounds, options);
}
