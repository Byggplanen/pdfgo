export type Point = {
  x: number;
  y: number;
};

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export function length(p: Point): number {
  // Adding 0.00001 to avoid division with zero when using
  // length to normalize (we don't care about such high
  // precision anyway)
  return Math.sqrt(p.x ** 2 + p.y ** 2) + 0.00001;
}

export function angle(p1: Point, p2: Point): number {
  const dot = p1.x * p2.x + p1.y * p2.y;
  return Math.acos(dot / (length(p1) * length(p2)));
}

// Calculates the normal vector (non-normalized) of the
// line segment composed by `p1` and `p2`.
export function segmentNormal(p1: Point, p2: Point): Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  return { x: -dy, y: dx };
}

export function add(p1: Point, p2: Point): Point {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

export function scale(p: Point, scalar: number): Point {
  return { x: p.x * scalar, y: p.y * scalar };
}

export function resize(p: Point, newLength: number): Point {
  return scale(p, newLength / length(p));
}

// Rotate `p` `theta` radians around (0,0).
export function rotate(p: Point, theta: number): Point {
  const x = p.x * Math.cos(theta) - p.y * Math.sin(theta);
  const y = p.x * Math.sin(theta) + p.y * Math.cos(theta);
  return { x, y };
}
