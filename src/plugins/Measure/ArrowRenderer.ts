import L from "leaflet";
import { generateArrowPathFromPath } from "./arrow-points";

// Extension of L.SVG that draw arrows at both ends of
// all polylines. Should only be used to render polylines
// and subclasses of it.
export class ArrowRenderer extends L.SVG {
  static readonly ARROWHEAD_LENGTH = 10;

  _addPath(layer: L.Layer): void {
    super._addPath(layer);

    // eslint-disable-next-line no-param-reassign
    layer._arrowPath = layer._path.cloneNode() as HTMLElement;
    this._rootGroup.appendChild(layer._arrowPath);
    layer.addInteractiveTarget(layer._arrowPath);
    this._setArrowPath(layer, layer._path.getAttribute("d")!);
  }

  _removePath(layer: L.Layer): void {
    super._removePath(layer);

    if (layer._arrowPath) {
      L.DomUtil.remove(layer._arrowPath);
      layer.removeInteractiveTarget(layer._arrowPath);
    }
  }

  _setPath(layer: L.Layer, path: string): void {
    super._setPath(layer, path);
    this._setArrowPath(layer, path);
  }

  // eslint-disable-next-line class-methods-use-this
  _setArrowPath(layer: L.Layer, path: string): void {
    const arrowPath = generateArrowPathFromPath(
      path,
      ArrowRenderer.ARROWHEAD_LENGTH
    );

    layer._arrowPath?.setAttribute("d", arrowPath);
  }
}

export function arrowRenderer(options?: L.RendererOptions) {
  return new ArrowRenderer(options);
}
