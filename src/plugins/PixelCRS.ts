import L from "leaflet";

// Same as L.CRS.Simple but with the y-axis inverted,
// akin to how pixels are ordered on a screen
const PixelCRS = L.Util.extend(L.CRS.Simple, {
  transformation: new L.Transformation(1, 0, 1, 0),
});

export default PixelCRS;
