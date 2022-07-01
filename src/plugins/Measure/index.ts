import L from "leaflet";
import { PDFPage } from "pdf-lib";

import Calibrate, { CalibrateCallback } from "./Calibrate";
import Ruler from "./Ruler";
import Area from "./Area";

export default class Measurements {
  static readonly LENGTH_REGEX: RegExp = /^(\d+)(ft|m)$/;

  private calibrate: Calibrate;

  private ruler: Ruler;

  private area: Area;

  constructor(
    private map: L.Map,
    page: PDFPage,
    canvasWidth: number,
    onCalibrate: CalibrateCallback
  ) {
    this.calibrate = new Calibrate(map, page, canvasWidth, onCalibrate);
    this.ruler = new Ruler(map, page, canvasWidth);
    this.area = new Area(map, page, canvasWidth);
    this.init();
  }

  // `length` from Calibrate callback and `actualLength` from user input.
  // `actualLength` should be a string suffixed with ft or m without any spaces.
  // For example: 23ft or 8m.
  adjustScale(length: number, actualLength: string) {
    const match = actualLength.match(Measurements.LENGTH_REGEX);
    if (!match) {
      throw new Error(`Invalid actual length ${actualLength}`);
    }

    const actualAmount = +match[1];
    const unit = match[2];
    const scaleFactor = actualAmount / length;

    this.ruler.updateScale(scaleFactor, unit);
    this.area.updateScale(scaleFactor, unit);
  }

  private init() {
    // Ruler, Calibrate and Area are all placed in the "custom" block
    // and hidden so we can trigger them from the Measurements actions
    // without showing another button in the toolbar
    this.map.pm.addControls({
      customControls: false,
    });

    this.map.pm.Toolbar.createCustomControl({
      name: "Measurements",
      block: "draw",
      title: "Perform Measurements",
      actions: [
        {
          text: "Calibrate",
          onClick: () => {
            this.calibrate.enable();
          },
        },
        {
          text: "Ruler",
          onClick: () => {
            this.ruler.enable();
          },
        },
        {
          text: "Area",
          onClick: () => {
            this.area.enable();
          },
        },
      ],
    });
  }
}
