import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import GeoJSON from "geojson";
import {
  PDFDocument,
  PDFPage,
  moveTo,
  lineTo,
  closePath,
  pushGraphicsState,
  popGraphicsState,
  PDFOperator,
  stroke,
  setLineWidth,
  setLineCap,
  LineCapStyle,
  addRandomSuffix,
  PDFName,
  setGraphicsState,
  rgb,
  setStrokingColor,
  setFillingColor,
  fillAndStroke,
  drawEllipse,
  degrees,
  PDFImage,
  PDFFont,
  StandardFonts,
  drawSvgPath,
  concatTransformationMatrix,
} from "pdf-lib";

import markerIcon from "./assets/marker-icon.png";
import { generateCloudPathFromPoints } from "./plugins/CloudPolyline/cloud-points";
import { CloudPolyline } from "./plugins/CloudPolyline";
import { toPDFCoords, toPDFRadius } from "./plugins/units";

type PDFExporterProps = {
  file: Uint8Array;
  name: string;
  canvasWidth: number;
};

type FeatureProperties = {
  shape:
    | "Rectangle"
    | "Marker"
    | "Circle"
    | "Line"
    | "Polygon"
    | "Text"
    | "CloudPolygon"
    | "Ruler";

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
  // Width in pixels of lines and shape outlines
  static readonly STROKE_WIDTH = 6;

  // Opacity of shape fill
  static readonly SHAPE_OPACITY = 0.2;

  // Fill and stroke color
  static readonly COLOR = rgb(0.2, 0.53, 1);

  // Text font size
  static readonly FONT_SIZE = 16;

  // PDF document to save
  private pdf: Promise<PDFDocument>;

  // Saved file name
  private name: string;

  // Used to convert to PDF coordinates. Only width is needed
  // since we assume that the aspect ratio is maintained.
  private canvasWidth: number;

  // Image used to draw markers. Loaded in `loadAssets()`.
  private markerImage?: Promise<PDFImage>;

  // Font used to render text. Loaded in `loadAssets()`.
  private font?: Promise<PDFFont>;

  constructor({ file, name, canvasWidth }: PDFExporterProps) {
    this.pdf = PDFDocument.load(file);
    this.name = name;
    this.canvasWidth = canvasWidth;
    this.loadAssets();
  }

  async getPage(pageNumber: number): Promise<PDFPage> {
    const pdf = await this.pdf;
    return pdf.getPage(pageNumber);
  }

  async drawLayers(layers: GeomanLayer[], pageNumber: number) {
    const pdf = await this.pdf;
    const page = pdf.getPage(pageNumber);

    const geo = this.toGeoJSON(layers, page);
    const geoPdf = this.geoJSONToPDFCoords(geo, page);

    const operators: PDFOperator[] = [];

    for await (const feature of geoPdf.features) {
      switch (feature.properties.shape) {
        case "Rectangle":
        case "Polygon": {
          const geometry = feature.geometry as GeoJSON.Polygon;
          operators.push(
            ...PDFExporter.drawPolygon(geometry.coordinates, page)
          );
          break;
        }
        case "Line": {
          const geometry = feature.geometry as GeoJSON.LineString;
          operators.push(...PDFExporter.drawLine(geometry.coordinates));
          break;
        }
        case "Circle": {
          const geometry = feature.geometry as GeoJSON.Point;
          operators.push(
            ...PDFExporter.drawCircle(
              geometry.coordinates,
              feature.properties.radius!,
              page
            )
          );
          break;
        }
        case "Marker": {
          const geometry = feature.geometry as GeoJSON.Point;
          await this.drawMarker(geometry.coordinates, page);
          break;
        }
        case "Text": {
          const geometry = feature.geometry as GeoJSON.Point;
          await this.drawText({
            coordinates: geometry.coordinates,
            text: feature.properties.text!,
            page,
          });
          break;
        }
        case "CloudPolygon": {
          const geometry = feature.geometry as GeoJSON.Polygon;
          operators.push(
            ...PDFExporter.drawCloudPolygon(geometry.coordinates, page)
          );
          break;
        }
        case "Ruler": {
          const geometry = feature.geometry as GeoJSON.LineString;
          const lineOperators = await this.drawRuler(
            geometry.coordinates,
            feature.properties.text!,
            page
          );
          operators.push(...lineOperators);
          break;
        }
        default:
      }
    }

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

  private async loadAssets() {
    const markerBytes = await fetch(markerIcon).then((res) =>
      res.arrayBuffer()
    );
    const pdf = await this.pdf;
    this.font = pdf.embedFont(StandardFonts.Helvetica);
    this.markerImage = pdf.embedPng(markerBytes);
  }

  // Rotation in radians
  private async drawText({
    coordinates,
    text,
    page,
    centerOrigin = false,
    rotation = 0,
    centerOffsetY = 0,
  }: {
    coordinates: GeoJSON.Position;
    text: string;
    page: PDFPage;
    centerOrigin?: boolean;
    rotation?: number;
    centerOffsetY?: number; // Only used if centerOrigin is true
  }): Promise<void> {
    const font = await this.font;
    if (!font) {
      throw new Error("Font undefined");
    }

    let [x, y] = coordinates;
    const width = font.widthOfTextAtSize(text, PDFExporter.FONT_SIZE);
    const height = font.heightAtSize(PDFExporter.FONT_SIZE);

    if (centerOrigin) {
      page.pushOperators(
        pushGraphicsState(),

        // Translate back
        concatTransformationMatrix(1, 0, 0, 1, x, y),

        // Rotate around origin
        concatTransformationMatrix(
          Math.cos(rotation),
          Math.sin(rotation),
          -Math.sin(rotation),
          Math.cos(rotation),
          0,
          0
        ),

        // Translate to move origin to center
        concatTransformationMatrix(1, 0, 0, 1, -1 * x, -1 * y)
      );

      x -= width / 2;
      y -= height / 2 - centerOffsetY;
    } else {
      // Move origin to top left instead of bottom left
      y -= height;
    }

    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(1, 1, 1),
    });

    page.drawText(text, {
      x,
      y,
      font,
      size: PDFExporter.FONT_SIZE,
      color: PDFExporter.COLOR,
      lineHeight: PDFExporter.FONT_SIZE,
    });

    if (centerOrigin) {
      page.pushOperators(popGraphicsState());
    }
  }

  private static drawPolygon(
    coordinates: GeoJSON.Position[][],
    page: PDFPage
  ): PDFOperator[] {
    return coordinates.flatMap((ring) => {
      const [startX, startY] = ring[0];
      const operators = [
        moveTo(startX, startY),
        ...ring.slice(1).map((coords) => {
          const [x, y] = coords;
          return lineTo(x, y);
        }),
        setFillingColor(this.COLOR),
        setStrokingColor(this.COLOR),
        setLineWidth(this.STROKE_WIDTH),
        closePath(),
        fillAndStroke(),
      ];

      return this.setOpacity(operators, this.SHAPE_OPACITY, page);
    });
  }

  private static drawCloudPolygon(
    coordinates: GeoJSON.Position[][],
    page: PDFPage
  ): PDFOperator[] {
    return coordinates.flatMap((ring) => {
      // SVG origin is in top left, but PDF in bottom left, so invert y
      const points = ring.map(([x, y]) => ({ x, y: page.getHeight() - y }));
      const path = generateCloudPathFromPoints(points, CloudPolyline.RADIUS);

      return drawSvgPath(path, {
        borderColor: this.COLOR,
        borderLineCap: LineCapStyle.Round,
        borderWidth: this.STROKE_WIDTH,
        color: this.COLOR,
        graphicsState: this.generateOpacityState(this.SHAPE_OPACITY, page),
        scale: 1,
        x: 0,
        y: page.getHeight(), // Same as above
      });
    });
  }

  private static drawCircle(
    coordinates: GeoJSON.Position,
    radius: number,
    page: PDFPage
  ): PDFOperator[] {
    const [x, y] = coordinates;
    return drawEllipse({
      borderColor: this.COLOR,
      borderWidth: this.STROKE_WIDTH,
      color: this.COLOR,
      graphicsState: this.generateOpacityState(this.SHAPE_OPACITY, page),
      x,
      y,
      xScale: radius,
      yScale: radius,
    });
  }

  private static drawLine(coordinates: GeoJSON.Position[]): PDFOperator[] {
    const [startX, startY] = coordinates[0];
    return [
      moveTo(startX, startY),
      ...coordinates.slice(1).map((coords) => {
        const [x, y] = coords;
        return lineTo(x, y);
      }),
      setStrokingColor(this.COLOR),
      setLineCap(LineCapStyle.Round),
      setLineWidth(this.STROKE_WIDTH),
      stroke(),
      closePath(),
    ];
  }

  private async drawMarker(
    coordinates: GeoJSON.Position,
    page: PDFPage
  ): Promise<void> {
    const [x, y] = coordinates;
    const markerImage = await this.markerImage;
    if (!markerImage) {
      throw new Error("Marker image undefined");
    }

    const { width, height } = markerImage.size();

    page.drawImage(markerImage, {
      height,
      width,
      x: x - width / 2, // Move the origin to the bottom center of the marker
      y,
      rotate: degrees(0),
      xSkew: degrees(0),
      ySkew: degrees(0),
    });
  }

  private async drawRuler(
    coordinates: GeoJSON.Position[],
    text: string,
    page: PDFPage
  ): Promise<PDFOperator[]> {
    const font = await this.font;
    if (!font) {
      throw new Error("Font not loaded");
    }

    const [x1, y1] = coordinates[0];
    const [x2, y2] = coordinates[1];
    const width = x2 - x1;
    const height = y2 - y1;
    const rotation = Math.atan2(height, width);
    const center = [x1 + width / 2, y1 + height / 2];

    await this.drawText({
      coordinates: center,
      text,
      page,
      centerOrigin: true,
      rotation,
      centerOffsetY: font.heightAtSize(PDFExporter.FONT_SIZE),
    });

    return PDFExporter.drawLine(coordinates);
  }

  // Returns a set of operators that together set the opacity of all
  // operators in the given `operators` array.
  private static setOpacity(
    operators: PDFOperator[],
    opacity: number,
    page: PDFPage
  ): PDFOperator[] {
    const gsKey = this.generateOpacityState(opacity, page);
    return [
      pushGraphicsState(),
      setGraphicsState(gsKey),
      ...operators,
      popGraphicsState(),
    ];
  }

  // Generate a graphics state with the given fill opacity.
  private static generateOpacityState(opacity: number, page: PDFPage): string {
    const gsKey = addRandomSuffix("GS", 10);
    const gsObject = {
      Type: "ExtGState",
      ca: opacity,
    };

    // Add graphics state dictionary with given opacity value
    page.node.setExtGState(PDFName.of(gsKey), page.doc.context.obj(gsObject));
    return gsKey;
  }

  // Convert layers to GeoJSON with properties
  private toGeoJSON(layers: GeomanLayer[], page: PDFPage): FeatureCollection {
    const features = layers.map((layer) => {
      const geo = layer.toGeoJSON();
      geo.properties.shape = layer.pm.getShape();

      switch (geo.properties.shape) {
        case "Circle": {
          const circle = layer as L.Circle;
          geo.properties.radius = toPDFRadius(
            circle.getRadius(),
            page,
            this.canvasWidth
          );
          break;
        }
        case "Text":
          geo.properties.text = layer.pm.getText();
          break;
        case "Ruler": {
          const ruler = layer as L.Polyline;
          geo.properties.text = ruler._text;
          break;
        }
        default:
      }

      return geo;
    });

    return {
      type: "FeatureCollection",
      features,
    };
  }

  // Convert GeoJSON in leaflet scale to pdf scale coordinates
  // Does not deepcopy so changes to the returned GeoJSON
  // might be reflected in the given GeoJSON.
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

          newFeature.geometry.coordinates = newFeature.geometry.coordinates.map(
            (ring) =>
              ring.map((coords) => toPDFCoords(coords, page, this.canvasWidth))
          );

          return newFeature;
        }
        case "LineString": {
          const newFeature = {
            ...feature,
          } as GeoJSON.Feature<GeoJSON.LineString, FeatureProperties>;

          newFeature.geometry.coordinates = newFeature.geometry.coordinates.map(
            (coords) => toPDFCoords(coords, page, this.canvasWidth)
          );

          return newFeature;
        }
        case "Point": {
          const newFeature = {
            ...feature,
          } as GeoJSON.Feature<GeoJSON.Point, FeatureProperties>;

          newFeature.geometry.coordinates = toPDFCoords(
            newFeature.geometry.coordinates,
            page,
            this.canvasWidth
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
