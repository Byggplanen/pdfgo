// See https://github.com/Leaflet/Leaflet/issues/4968
import L from "leaflet";

import iconRetinaUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import iconUrl from "leaflet/dist/images/marker-icon-2x.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export {};
