export declare type Point = {
    x: number;
    y: number;
};
export declare function distance(p1: Point, p2: Point): number;
export declare function length(p: Point): number;
export declare function angle(p1: Point, p2: Point): number;
export declare function segmentNormal(p1: Point, p2: Point): Point;
export declare function add(p1: Point, p2: Point): Point;
export declare function scale(p: Point, scalar: number): Point;
export declare function resize(p: Point, newLength: number): Point;
export declare function rotate(p: Point, theta: number): Point;
//# sourceMappingURL=Point.d.ts.map