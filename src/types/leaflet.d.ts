import "leaflet";

declare module "leaflet" {
  interface Map {
    _latLngBoundsToNewLayerBounds(
      latLngBounds: LatLngBounds,
      zoom: number,
      center: LatLng
    ): Bounds;
  }

  interface SVG {
    _rootGroup: SVGGElement;
    _addPath(layer: Layer): void;
    _setPath(layer: Layer, path: string): void;
    _removePath(layer: Layer): void;
  }

  interface Layer {
    _path: HTMLElement;

    // Only when rendered by `ArrowRenderer`
    _arrowPath?: HTMLElement;

    addInteractiveTarget(targetEl: HTMLElement): Layer;
    removeInteractiveTarget(targetEl: HTMLElement): Layer;
  }
}
