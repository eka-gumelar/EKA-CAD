import { Point, Unit, CADShape } from '../types/cad';

// Unit conversion factors relative to 1 Meter
export const UNIT_FACTORS: Record<Unit, number> = {
  m: 1,
  cm: 100,
  mm: 1000,
  ft: 3.28084,
};

export const UNIT_LABELS: Record<Unit, string> = {
  m: 'm',
  cm: 'cm',
  mm: 'mm',
  ft: 'ft',
};

export const UNIT_AREA_LABELS: Record<Unit, string> = {
  m: 'm²',
  cm: 'cm²',
  mm: 'mm²',
  ft: 'sq ft',
};

/**
 * Converts pixels on canvas to meters based on scale
 */
export function pxToMeters(px: number, pixelsPerMeter: number): number {
  return px / pixelsPerMeter;
}

/**
 * Converts meters to pixels
 */
export function metersToPx(meters: number, pixelsPerMeter: number): number {
  return meters * pixelsPerMeter;
}

/**
 * Converts pixels to any target unit
 */
export function pxToUnit(px: number, pixelsPerMeter: number, targetUnit: Unit): number {
  const meters = pxToMeters(px, pixelsPerMeter);
  return meters * UNIT_FACTORS[targetUnit];
}

/**
 * Converts any unit to pixels
 */
export function unitToPx(value: number, unit: Unit, pixelsPerMeter: number): number {
  const meters = value / UNIT_FACTORS[unit];
  return metersToPx(meters, pixelsPerMeter);
}

/**
 * Formats a distance with unit symbol (e.g., "3.50 m", "350 cm")
 */
export function formatDistance(px: number, pixelsPerMeter: number, unit: Unit, decimals: number = 2): string {
  const val = pxToUnit(px, pixelsPerMeter, unit);
  return `${val.toFixed(decimals)} ${UNIT_LABELS[unit]}`;
}

/**
 * Formats an area with unit symbol (e.g., "14.50 m²")
 */
export function formatArea(areaM2: number, unit: Unit, decimals: number = 2): string {
  const factor = UNIT_FACTORS[unit];
  const areaInUnit = areaM2 * (factor * factor);
  return `${areaInUnit.toFixed(decimals)} ${UNIT_AREA_LABELS[unit]}`;
}

/**
 * Shoelace formula to compute polygon area in pixels²
 */
export function calculatePolygonAreaPx(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Calculates real-world area in square meters for any shape
 */
export function calculateShapeAreaM2(shape: CADShape, pixelsPerMeter: number): number {
  const ppm2 = pixelsPerMeter * pixelsPerMeter;
  
  if (shape.type === 'rect_room') {
    return (shape.width * shape.height) / ppm2;
  }
  
  if (shape.type === 'circle_room' || shape.type === 'column_round') {
    const r = Math.min(shape.width, shape.height) / 2;
    return (Math.PI * r * r) / ppm2;
  }
  
  if (shape.type === 'l_room') {
    // Standard L shape: full bounding box minus cut-out quadrant (approx 75% or specific notch)
    // 3/4 box default
    return (shape.width * shape.height * 0.75) / ppm2;
  }

  if (shape.type === 't_room') {
    // Standard T shape: cross bar + stem (approx 60% of bounding box)
    return (shape.width * shape.height * 0.625) / ppm2;
  }
  
  if (shape.type === 'polygon' && shape.points && shape.points.length >= 3) {
    const areaPx = calculatePolygonAreaPx(shape.points);
    return areaPx / ppm2;
  }
  
  return (shape.width * shape.height) / ppm2;
}

/**
 * Calculates perimeter of shape in meters
 */
export function calculateShapePerimeterM(shape: CADShape, pixelsPerMeter: number): number {
  if (shape.type === 'polygon' && shape.points && shape.points.length >= 3) {
    let perimeterPx = 0;
    for (let i = 0; i < shape.points.length; i++) {
      const p1 = shape.points[i];
      const p2 = shape.points[(i + 1) % shape.points.length];
      perimeterPx += Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }
    return perimeterPx / pixelsPerMeter;
  }
  
  if (shape.type === 'circle_room' || shape.type === 'column_round') {
    const r = Math.min(shape.width, shape.height) / 2;
    return (2 * Math.PI * r) / pixelsPerMeter;
  }
  
  // Rectangle and bounding box
  return (2 * (shape.width + shape.height)) / pixelsPerMeter;
}

/**
 * Snaps a pixel coordinate to grid
 */
export function snapToGrid(
  coord: number,
  gridSizeMeters: number,
  pixelsPerMeter: number
): number {
  const gridPx = gridSizeMeters * pixelsPerMeter;
  return Math.round(coord / gridPx) * gridPx;
}

/**
 * Calculate distance between two points
 */
export function distanceBetween(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}
