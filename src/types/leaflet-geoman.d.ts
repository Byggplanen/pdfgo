import "leaflet";

declare module "leaflet" {
  namespace PM {
    interface Draw {
      Ruler: Ruler;
    }

    interface Ruler {
      _finishShape(): void;
      _hintline: L.Polyline;
      _layer: L.Polyline;
    }
  }
}
