import "leaflet";

declare module "leaflet" {
  namespace PM {
    interface Draw {
      [shapeName: string]: Shape;
    }

    interface Shape {
      _finishShape(): void;
      _hintline: L.Polyline;
      _layer: L.Polyline;
    }
  }
}
