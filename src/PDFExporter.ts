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
  RGB,
} from "pdf-lib";

import markerIcon from "./assets/marker-icon.png";
import { generateCloudPathFromPoints } from "./plugins/CloudPolyline/cloud-points";
import { toPDFCoords, toPDFRadius } from "./plugins/units";
import { generateArrowPathFromPoints } from "./plugins/Measure/arrow-points";
import { ArrowRenderer } from "./plugins/Measure/ArrowRenderer";

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
    | "Ruler"
    | "Area";

  // Color of the shape
  color: RGB;

  // Only used when shape is "Text"
  text?: string;

  // Only used when shape is "Circle"
  radius?: number;

  // Only used when shape is "Area"
  center?: GeoJSON.Position;
};

type FeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  FeatureProperties
>;

type DrawTextOptions = {
  coordinates: GeoJSON.Position;
  text: string;
  page: PDFPage;
  centerOrigin?: boolean;
  rotation?: number;
  centerOffsetY?: number; // Only used if centerOrigin is true
};

export type GeomanLayer = (
  | L.Polyline
  | L.Marker
  | L.CircleMarker
  | L.Polygon
) & {
  pm: L.PM.PMLayer;
};

export default class PDFExporter {
  // Width in pixels of lines and shape outlines
  static readonly STROKE_WIDTH = 6;

  // Opacity of shape fill
  static readonly SHAPE_OPACITY = 0.2;

  // Text font size
  static readonly FONT_SIZE = 16;

  // Revision cloud arc radius
  static readonly CLOUD_RADIUS = 10;

  // Default fill and stroke color
  static readonly DEFAULT_COLOR = rgb(0.2, 0.53, 1);

  // Text color
  static readonly TEXT_COLOR = rgb(0, 0, 0);

  // Fill and stroke color for measurement layers (ruler, area)
  static readonly MEASUREMENT_COLOR = rgb(1, 0, 0);

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

  /**
   * Should not be called directly, see {@link PDFExporter.init} instead.
   */
  private constructor({ file, name, canvasWidth }: PDFExporterProps) {
    this.pdf = PDFDocument.load(file);
    this.name = name;
    this.canvasWidth = canvasWidth;
  }

  static async init(props: PDFExporterProps) {
    const pdfExporter = new PDFExporter(props);
    await pdfExporter.loadAssets();
    return pdfExporter;
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
            ...PDFExporter.drawPolygon(
              geometry.coordinates,
              feature.properties.color,
              page
            )
          );
          break;
        }
        case "Line": {
          const geometry = feature.geometry as GeoJSON.LineString;
          operators.push(
            ...PDFExporter.drawLine(
              geometry.coordinates,
              feature.properties.color
            )
          );
          break;
        }
        case "Circle": {
          const geometry = feature.geometry as GeoJSON.Point;
          operators.push(
            ...PDFExporter.drawCircle(
              geometry.coordinates,
              feature.properties.radius!,
              feature.properties.color,
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
            ...PDFExporter.drawCloudPolygon(
              geometry.coordinates,
              feature.properties.color,
              page
            )
          );
          break;
        }
        case "Ruler": {
          const geometry = feature.geometry as GeoJSON.LineString;
          const lineOperators = await this.drawRuler(
            geometry.coordinates,
            feature.properties.text!,
            feature.properties.color,
            page
          );
          operators.push(...lineOperators);
          break;
        }

        case "Area": {
          const geometry = feature.geometry as GeoJSON.Polygon;
          await this.drawArea(
            geometry.coordinates,
            feature.properties.text!,
            feature.properties.color,
            feature.properties.center!,
            page
          );
          break;
        }
        default:
      }
    }

    page.pushOperators(pushGraphicsState(), ...operators, popGraphicsState());
  }

  async savePdf(): Promise<Uint8Array> {
    const pdf = await this.pdf;
    return pdf.save();
  }

  async downloadPdf() {
    const bytes = await this.savePdf();
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
  }: DrawTextOptions): Promise<void> {
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
      color: PDFExporter.TEXT_COLOR,
      lineHeight: PDFExporter.FONT_SIZE,
    });

    if (centerOrigin) {
      page.pushOperators(popGraphicsState());
    }
  }

  private static drawPolygon(
    coordinates: GeoJSON.Position[][],
    color: RGB,
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
        setFillingColor(color),
        setStrokingColor(color),
        setLineWidth(this.STROKE_WIDTH),
        closePath(),
        fillAndStroke(),
      ];

      return this.setOpacity(operators, this.SHAPE_OPACITY, page);
    });
  }

  private static drawCloudPolygon(
    coordinates: GeoJSON.Position[][],
    color: RGB,
    page: PDFPage
  ): PDFOperator[] {
    return coordinates.flatMap((ring) => {
      // SVG origin is in top left, but PDF in bottom left, so invert y
      const points = ring.map(([x, y]) => ({ x, y: page.getHeight() - y }));
      const path = generateCloudPathFromPoints(
        points,
        PDFExporter.CLOUD_RADIUS
      );

      return drawSvgPath(path, {
        borderColor: color,
        borderLineCap: LineCapStyle.Round,
        borderWidth: this.STROKE_WIDTH,
        color,
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
    color: RGB,
    page: PDFPage
  ): PDFOperator[] {
    const [x, y] = coordinates;
    return drawEllipse({
      borderColor: color,
      borderWidth: this.STROKE_WIDTH,
      color,
      graphicsState: this.generateOpacityState(this.SHAPE_OPACITY, page),
      x,
      y,
      xScale: radius,
      yScale: radius,
    });
  }

  private static drawLine(
    coordinates: GeoJSON.Position[],
    color: RGB
  ): PDFOperator[] {
    const [startX, startY] = coordinates[0];
    return [
      moveTo(startX, startY),
      ...coordinates.slice(1).map((coords) => {
        const [x, y] = coords;
        return lineTo(x, y);
      }),
      setStrokingColor(color),
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
    color: RGB,
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

    // SVG origin is in top left, but PDF in bottom left, so invert y
    const points = coordinates.map(([x, y]) => ({
      x,
      y: page.getHeight() - y,
    }));
    const path = generateArrowPathFromPoints(
      points,
      ArrowRenderer.ARROWHEAD_LENGTH,
      true
    );

    return drawSvgPath(path, {
      borderColor: color,
      borderLineCap: LineCapStyle.Round,
      borderWidth: PDFExporter.STROKE_WIDTH,
      color: undefined,
      graphicsState: PDFExporter.generateOpacityState(
        PDFExporter.SHAPE_OPACITY,
        page
      ),
      scale: 1,
      x: 0,
      y: page.getHeight(), // Same as above
    });
  }

  private async drawArea(
    coordinates: GeoJSON.Position[][],
    text: string,
    color: RGB,
    center: GeoJSON.Position,
    page: PDFPage
  ): Promise<void> {
    const font = await this.font;
    if (!font) {
      throw new Error("Font not loaded");
    }

    // Need to draw polygon first
    page.pushOperators(
      pushGraphicsState(),
      ...PDFExporter.drawPolygon(coordinates, color, page),
      popGraphicsState()
    );

    await this.drawText({
      coordinates: center,
      text,
      page,
      centerOrigin: true,
    });
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
    const { width: pageWidth, height: pageHeight } = page.getMediaBox();
    const features = layers.map((layer) => {
      const geo = layer.toGeoJSON();
      geo.properties.shape = layer.pm.getShape();
      geo.properties.color = PDFExporter.DEFAULT_COLOR;

      const options = layer.options as L.PathOptions;
      geo.properties.color =
        PDFExporter.hexToRgb(options.color) ?? PDFExporter.DEFAULT_COLOR;

      switch (geo.properties.shape) {
        case "Circle": {
          const circle = layer as L.Circle;
          geo.properties.radius = toPDFRadius(
            circle.getRadius(),
            pageWidth,
            this.canvasWidth
          );
          break;
        }
        case "Text":
          geo.properties.text = layer.pm.getText().trim();
          break;
        case "Ruler": {
          const ruler = layer as L.Polyline;
          geo.properties.text = ruler._text;
          geo.properties.color = PDFExporter.MEASUREMENT_COLOR;
          break;
        }
        case "Area": {
          const polygon = layer as L.Polygon;
          const { lng: x, lat: y } = polygon.getCenter();

          // Should be a string
          geo.properties.text = polygon.getTooltip()?.getContent();
          geo.properties.color = PDFExporter.MEASUREMENT_COLOR;
          geo.properties.center = toPDFCoords(
            [x, y],
            pageWidth,
            pageHeight,
            this.canvasWidth
          );
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
    const { width: pageWidth, height: pageHeight } = page.getMediaBox();
    const features = geo.features.map((feature) => {
      switch (feature.geometry.type) {
        case "Polygon": {
          const newFeature = {
            ...feature,
          } as GeoJSON.Feature<GeoJSON.Polygon, FeatureProperties>;

          newFeature.geometry.coordinates = newFeature.geometry.coordinates.map(
            (ring) =>
              ring.map((coords) =>
                toPDFCoords(coords, pageWidth, pageHeight, this.canvasWidth)
              )
          );

          return newFeature;
        }
        case "LineString": {
          const newFeature = {
            ...feature,
          } as GeoJSON.Feature<GeoJSON.LineString, FeatureProperties>;

          newFeature.geometry.coordinates = newFeature.geometry.coordinates.map(
            (coords) =>
              toPDFCoords(coords, pageWidth, pageHeight, this.canvasWidth)
          );

          return newFeature;
        }
        case "Point": {
          const newFeature = {
            ...feature,
          } as GeoJSON.Feature<GeoJSON.Point, FeatureProperties>;

          newFeature.geometry.coordinates = toPDFCoords(
            newFeature.geometry.coordinates,
            pageWidth,
            pageHeight,
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

  // #abcdef to RGB
  private static hexToRgb(hex?: string): RGB | undefined {
    if (!hex) {
      return undefined;
    }

    const bigint = parseInt(hex.slice(1), 16);

    /* eslint-disable no-bitwise */
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    /* eslint-enable no-bitwise */

    return rgb(r / 255, g / 255, b / 255);
  }
}
