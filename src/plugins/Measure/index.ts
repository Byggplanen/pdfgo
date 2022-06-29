import L from "leaflet";
import { PDFPage } from "pdf-lib";

import Calibrate from "./Calibrate";
import Ruler from "./Ruler";
import Area from "./Area";

export default function addMeasurementsToolbar(
  map: L.Map,
  page: PDFPage,
  canvasWidth: number
) {
  const calibrate = new Calibrate(map, page, canvasWidth);
  const ruler = new Ruler(map, page, canvasWidth);
  const area = new Area(map, page, canvasWidth);

  // Ruler, Calibrate and Area are all placed in the "custom" block
  // and hidden so we can trigger them from the Measurements actions
  // without showing another button in the toolbar
  map.pm.addControls({
    customControls: false,
  });

  map.pm.Toolbar.createCustomControl({
    name: "Measurements",
    block: "draw",
    title: "Perform Measurements",
    actions: [
      {
        text: "Calibrate",
        onClick: () => {
          calibrate.activate();
        },
      },
      {
        text: "Ruler",
        onClick: () => {
          ruler.activate();
        },
      },
      {
        text: "Area",
        onClick: () => {
          area.activate();
        },
      },
    ],
  });
}
