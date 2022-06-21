import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import GeoJSON from "geojson";

import {
  PDFDocument,
  PDFPage,
  moveTo,
  lineTo,
  setFillingRgbColor,
  closePath,
  fill,
  pushGraphicsState,
  popGraphicsState,
  PDFOperator,
} from "pdf-lib";

type PDFExporterProps = {
  file: Uint8Array;
  name: string;
  canvasWidth: number;
};

type FeatureProperties = {
  shape: "Rectangle" | "Marker" | "Circle" | "Line" | "Polygon" | "Text";

  // Only used when shape is "Text"
  text?: string;

  // Only used when shape is "Circle"
  radius?: number;
};

type FeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  FeatureProperties
>;

export type GeomanLayer = (L.Polyline | L.Marker | L.CircleMarker) & {
  pm: L.PM.PMLayer;
};

export default class PDFExporter {
  // PDF document to save
  private pdf: Promise<PDFDocument>;

  // Saved file name
  private name: string;

  // Used to convert to PDF coordinates. Only width is needed
  // since we assume that the aspect ratio is maintained.
  private canvasWidth: number;

  constructor({ file, name, canvasWidth }: PDFExporterProps) {
    this.pdf = PDFDocument.load(file);
    this.name = name;
    this.canvasWidth = canvasWidth;
  }

  async drawLayers(layers: GeomanLayer[], pageNumber: number) {
    const pdf = await this.pdf;
    const page = pdf.getPage(pageNumber);

    const geo = this.toGeoJSON(layers, page);
    const geoPdf = this.geoJSONToPDFCoords(geo, page);
    console.log(geoPdf);

    const operators = geoPdf.features.flatMap((feature) => {
      switch (feature.properties.shape) {
        case "Rectangle":
        case "Polygon": {
          const geometry = feature.geometry as GeoJSON.Polygon;
          return PDFExporter.drawPolygon(geometry.coordinates);
        }
        default:
          return [];
      }
    });

    page.pushOperators(pushGraphicsState(), ...operators, popGraphicsState());
  }

  async downloadPdf() {
    const pdf = await this.pdf;
    const bytes = await pdf.save();
    const blob = new Blob([bytes.buffer]);

    const link = document.createElement("a");
    link.setAttribute("download", this.name);
    link.setAttribute("href", URL.createObjectURL(blob));

    link.click();
  }

  private static drawPolygon(coordinates: GeoJSON.Position[][]): PDFOperator[] {
    return coordinates.flatMap((ring) => {
      const [startX, startY] = ring[0];
      return [
        moveTo(startX, startY),
        ...ring.slice(1).map((coords) => {
          const [x, y] = coords;
          return lineTo(x, y);
        }),
        closePath(),
        setFillingRgbColor(0, 50, 100),
        fill(),
      ];
    });
  }

  // Convert layers to GeoJSON with properties
  private toGeoJSON(layers: GeomanLayer[], page: PDFPage): FeatureCollection {
    const features = layers.map((layer) => {
      const geo = layer.toGeoJSON();
      geo.properties.shape = layer.pm.getShape();

      switch (geo.properties.shape) {
        case "Circle": {
          const circle = layer as L.Circle;
          geo.properties.radius = this.toPDFRadius(circle.getRadius(), page);
          break;
        }
        case "Text":
          geo.properties.text = layer.pm.getText();
          break;
        default:
      }

      return geo;
    });

    return {
      type: "FeatureCollection",
      features,
    };
  }

  private toPDFCoords(
    point: GeoJSON.Position,
    page: PDFPage
  ): GeoJSON.Position {
    const { width, height } = page.getMediaBox();
    const factor = width / this.canvasWidth;
    const x = point[0] * factor;

    // PDF origin is in bottom left, but GeoJSON in top left
    const y = height - point[1] * factor;

    return [x, y];
  }

  private toPDFRadius(radius: number, page: PDFPage): number {
    const { width } = page.getMediaBox();
    const factor = width / this.canvasWidth;

    return radius * factor;
  }

  // Convert GeoJSON in leaflet scale to pdf scale coordinates
  private geoJSONToPDFCoords(
    geo: FeatureCollection,
    page: PDFPage
  ): FeatureCollection {
    const features = geo.features.map((feature) => {
      switch (feature.geometry.type) {
        case "Polygon": {
          const newFeature = {
            ...feature,
          } as GeoJSON.Feature<GeoJSON.Polygon, FeatureProperties>;

          newFeature.geometry.coordinates.map((ring) =>
            ring.map((coords) => this.toPDFCoords(coords, page))
          );

          return newFeature;
        }
        case "LineString": {
          const newFeature = {
            ...feature,
          } as GeoJSON.Feature<GeoJSON.LineString, FeatureProperties>;

          newFeature.geometry.coordinates.map((coords) =>
            this.toPDFCoords(coords, page)
          );

          return newFeature;
        }
        case "Point": {
          const newFeature = {
            ...feature,
          } as GeoJSON.Feature<GeoJSON.Point, FeatureProperties>;

          newFeature.geometry.coordinates = this.toPDFCoords(
            newFeature.geometry.coordinates,
            page
          );

          return newFeature;
        }
        default:
          throw new Error(`Unimplemented shape type ${feature.geometry.type}`);
      }
    });

    return { ...geo, features };
  }
}
