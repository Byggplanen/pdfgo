import "leaflet";

declare module "leaflet" {
  interface GridLayer {
    _tileCoordsToBounds(tile: Coords): LatLngExpression;
    _keyToTileCoords(key: string): Coords;
  }

  interface Map {
    _latLngBoundsToNewLayerBounds(
      latLngBounds: LatLngBounds,
      zoom: number,
      center: LatLng
    ): Bounds;
  }

  interface SVG {
    _setPath(layer: L.Layer, path: string): void;
  }

  // Leaflet.PolylineDecorator
  namespace Symbol {
    interface MarkerOptions {
      angleCorrection: number;
    }
  }
}
