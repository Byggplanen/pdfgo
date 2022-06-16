import L from "leaflet";

const DebugLayer = L.GridLayer.extend({
  createTile(coords: L.Coords) {
    const tile = L.DomUtil.create("div");
    tile.style.outline = "1px solid blue";
    tile.innerHTML = [coords.x, coords.y, coords.z].join(", ");

    console.log("DEBUG: Drawing", this._tileCoordsToKey(coords));

    return tile;
  },
});

function debugLayer(options?: L.GridLayerOptions): L.GridLayer {
  // @ts-ignore
  return new DebugLayer(options);
  // @ts-enable
}

export default debugLayer;
