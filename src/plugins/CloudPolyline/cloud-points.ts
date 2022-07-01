import { SVGPathData } from "svg-pathdata";
import { Point, distance } from "../Point";

function lerp(x1: number, x2: number, t: number): number {
  return (1 - t) * x1 + t * x2;
}

// Returns a list of points between which the cloud arcs
// should be drawn, given the points representing the polyline
// and the arc radius.
function generateCloudPointsFromPoints(
  points: Point[],
  radius: number
): Point[] {
  // Sliding window with length 2 (chunk into pairs with overlap)
  const pairs: [Point, Point][] = points.flatMap((_, i) => {
    const pair = points.slice(i, i + 2) as [Point, Point];
    return pair.length === 2 ? [pair] : [];
  });

  // Create multiple points between each pair of points based
  // on the cloud arc radius
  const cloudPoints = [
    points[0],
    ...pairs.flatMap((pair) => {
      const [start, end] = pair;
      const normalizedRadius = radius / distance(start, end);
      const internalPoints: Point[] = [];

      let t = 0;
      for (; t <= 1; t += normalizedRadius * 2) {
        const x = lerp(start.x, end.x, t);
        const y = lerp(start.y, end.y, t);
        internalPoints.push({ x, y });
      }

      // Add an extra arc if the distance cannot be evenly
      // divided into segments of radius * 2 (arc diameter).
      if (t > 1) {
        internalPoints.push({ x: end.x, y: end.y });
      }

      return internalPoints;
    }),
  ];

  return cloudPoints;
}

// Generates a SVG path for a cloud polyline based on the given polyline
// points and arc radius.
export function generateCloudPathFromPoints(
  points: Point[],
  radius: number,
  invert: boolean = false
): string {
  const cloudPoints = generateCloudPointsFromPoints(points, radius);
  const path = [
    `M ${points[0].x} ${points[0].y}`,
    ...cloudPoints.slice(1).map((point) => {
      const rx = radius;
      const ry = radius;
      const xAxisRotation = 0;
      const largeArcFlag = 0;
      const sweepFlag = +!invert;
      const { x, y } = point;

      return `A ${rx} ${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${x} ${y}`;
    }),
  ];

  return path.join("");
}

// Takes an existing polyline path (d attribute) and transforms it
// into a cloud polyline path.
export function generateCloudPathFromPath(
  path: string,
  radius: number,
  invert: boolean = false
): string {
  const pathData = new SVGPathData(path);
  if (!pathData.commands.length) {
    return "";
  }

  // Polylines should only consist of move to, line to and close path
  // commands, but filtering just in case
  /* eslint-disable no-bitwise */
  const relevant = SVGPathData.MOVE_TO | SVGPathData.LINE_TO;
  const filteredPoints = pathData.commands.filter(
    (command) => command.type & relevant
  ) as Point[];
  /* eslint-enable no-bitwise */

  // In the case of a polygon, we need to repeat the first point
  // in place of the close path command
  if (pathData.commands.at(-1)!.type === SVGPathData.CLOSE_PATH) {
    filteredPoints.push(filteredPoints[0]);
  }

  return generateCloudPathFromPoints(filteredPoints, radius, invert);
}
