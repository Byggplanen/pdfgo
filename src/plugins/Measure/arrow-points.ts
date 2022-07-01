import { SVGPathData } from "svg-pathdata";
import { Point, rotate, segmentNormal, add, resize } from "../Point";

// Generates an arrow head path around `p2`.
function generateArrowHeadPathFromPair(
  p1: Point,
  p2: Point,
  arrowheadLength: number
) {
  const angle = Math.PI / 4; // 45 deg
  const normal = segmentNormal(p1, p2);
  const left = resize(rotate(normal, angle), arrowheadLength);
  const right = resize(rotate(normal, angle * 3), arrowheadLength);
  const { x: l1, y: l2 } = add(p2, left);
  const { x: r1, y: r2 } = add(p2, right);
  const { x, y } = p2;

  return `M${l1} ${l2} L${x} ${y} L${r1} ${r2}`;
}

export function generateArrowPathFromPoints(
  points: Point[],
  arrowheadLength: number,
  includeLine = false
): string {
  if (points.length < 2) {
    throw new Error("Need at least two points");
  }

  const { x: x0, y: y0 } = points[0];

  const lineOps = includeLine
    ? [`M${x0} ${y0}`, ...points.slice(1).map(({ x, y }) => `L${x} ${y}`)]
    : [];

  const left = generateArrowHeadPathFromPair(
    points[1],
    points[0],
    arrowheadLength
  );

  const right = generateArrowHeadPathFromPair(
    points.at(-2)!,
    points.at(-1)!,
    arrowheadLength
  );

  return [...lineOps, left, right].join(" ");
}

export function generateArrowPathFromPath(
  path: string,
  arrowheadLength: number,
  includeLine = false
): string {
  const pathData = new SVGPathData(path);
  if (!pathData.commands.length || pathData.commands.length < 2) {
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

  return generateArrowPathFromPoints(
    filteredPoints,
    arrowheadLength,
    includeLine
  );
}
