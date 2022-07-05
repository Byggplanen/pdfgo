import GeoJSON from "geojson";

export function toPDFCoords(
  point: GeoJSON.Position,
  pageWidth: number,
  pageHeight: number,
  canvasWidth: number
): GeoJSON.Position {
  const factor = pageWidth / canvasWidth;
  const x = point[0] * factor;

  // PDF origin is in bottom left, but GeoJSON in top left
  const y = pageHeight - point[1] * factor;

  return [x, y];
}

export function toPDFRadius(
  radius: number,
  pageWidth: number,
  canvasWidth: number
): number {
  const factor = pageWidth / canvasWidth;

  return radius * factor;
}
