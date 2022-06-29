import { PDFPage } from "pdf-lib";
import GeoJSON from "geojson";

export function toPDFCoords(
  point: GeoJSON.Position,
  page: PDFPage,
  canvasWidth: number
): GeoJSON.Position {
  const { width, height } = page.getMediaBox();
  const factor = width / canvasWidth;
  const x = point[0] * factor;

  // PDF origin is in bottom left, but GeoJSON in top left
  const y = height - point[1] * factor;

  return [x, y];
}

export function toPDFRadius(
  radius: number,
  page: PDFPage,
  canvasWidth: number
): number {
  const { width } = page.getMediaBox();
  const factor = width / canvasWidth;

  return radius * factor;
}
