import "leaflet";

declare module "leaflet" {
  interface Polyline {
    // The text set by `setText()`
    _text: string;
  }
}
