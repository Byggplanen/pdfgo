import L from "leaflet";

export class DebugLayer extends L.GridLayer {
  createTile(coords: L.Coords) {
    const tile = L.DomUtil.create("div");
    tile.style.outline = "1px solid blue";
    tile.innerHTML = [coords.x, coords.y, coords.z].join(", ");

    console.log("DEBUG: Drawing", this._tileCoordsToKey(coords));

    return tile;
  }
}

export function debugLayer(options?: L.GridLayerOptions) {
  return new DebugLayer(options);
}
