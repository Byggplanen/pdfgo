import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "leaflet-textpath";
import { PDFPage } from "pdf-lib";

import { toPDFCoords } from "../units";

export default class Area {
  static readonly TEXT_OPTIONS: L.TextPathOptions = {
    center: true,
    offset: -10,
    attributes: {
      class: "leaflet-area-text",
    },
  };
}
