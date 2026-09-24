import { CADShape, SmartLabelResult, SmartDimensionBadgesResult } from '../types/cad';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Computes world-space axis-aligned bounding box (AABB) for any CAD shape,
 * accurately handling rotation around the shape's center.
 */
export function computeShapeAABB(shape: CADShape): BoundingBox {
  const w = Math.max(1, shape.width);
  const h = Math.max(1, shape.height);
  const rotation = shape.rotation || 0;

  if (rotation === 0) {
    return {
      minX: shape.x,
      minY: shape.y,
      maxX: shape.x + w,
      maxY: shape.y + h,
    };
  }

  const cx = shape.x + w / 2;
  const cy = shape.y + h / 2;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const corners = [
    { x: shape.x, y: shape.y },
    { x: shape.x + w, y: shape.y },
    { x: shape.x + w, y: shape.y + h },
    { x: shape.x, y: shape.y + h },
  ];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const corner of corners) {
    const rx = cx + (corner.x - cx) * cos - (corner.y - cy) * sin;
    const ry = cy + (corner.x - cx) * sin + (corner.y - cy) * cos;
    if (rx < minX) minX = rx;
    if (rx > maxX) maxX = rx;
    if (ry < minY) minY = ry;
    if (ry > maxY) maxY = ry;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Checks if two bounding boxes overlap with an optional margin padding.
 */
export function rectsOverlap(r1: BoundingBox, r2: BoundingBox, margin: number = 0): boolean {
  return !(
    r1.maxX < r2.minX - margin ||
    r1.minX > r2.maxX + margin ||
    r1.maxY < r2.minY - margin ||
    r1.minY > r2.maxY + margin
  );
}

/**
 * Calculates the intersecting area between two bounding boxes.
 */
export function getOverlapArea(r1: BoundingBox, r2: BoundingBox): number {
  const overlapX = Math.max(0, Math.min(r1.maxX, r2.maxX) - Math.max(r1.minX, r2.minX));
  const overlapY = Math.max(0, Math.min(r1.maxY, r2.maxY) - Math.max(r1.minY, r2.minY));
  return overlapX * overlapY;
}

/**
 * Transforms a local point inside a shape to canvas world-space coordinates.
 */
export function localToWorld(shape: CADShape, localX: number, localY: number): { x: number; y: number } {
  const rotation = shape.rotation || 0;
  if (rotation === 0) {
    return {
      x: shape.x + localX,
      y: shape.y + localY,
    };
  }

  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = localX - shape.width / 2;
  const dy = localY - shape.height / 2;

  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

/**
 * Calculates a dynamic collision-free position for a room's or custom shape's center label badge.
 * If furniture, walls, columns, or other objects overlap the center of the room,
 * the label badge automatically and smoothly moves to an open, unobstructed area.
 */
export function calculateSmartCenterLabelPosition(
  targetShape: CADShape,
  allShapes: CADShape[],
  enabled: boolean = true,
  badgeWidth: number = 126,
  badgeHeight: number = 38
): SmartLabelResult {
  const w = targetShape.width;
  const h = targetShape.height;
  const defaultX = w / 2;
  const defaultY = h / 2;

  // Small or narrow shapes maintain center
  if (!enabled || w < 70 || h < 50) {
    return {
      x: defaultX,
      y: defaultY,
      isDisplaced: false,
      offsetDistance: 0,
      placement: 'center',
    };
  }

  // Pre-filter candidate colliders (furniture, walls, columns, doors, other rooms)
  const candidateColliders = allShapes.filter((other) => {
    if (other.id === targetShape.id) return false;
    if (other.width <= 0 || other.height <= 0) return false;
    return true;
  });

  if (candidateColliders.length === 0) {
    return {
      x: defaultX,
      y: defaultY,
      isDisplaced: false,
      offsetDistance: 0,
      placement: 'center',
    };
  }

  // Pre-calculate candidate AABBs
  const colliderBoxes = candidateColliders.map((c) => ({
    shape: c,
    box: computeShapeAABB(c),
  }));

  const checkBadgeCollision = (lx: number, ly: number, bw: number, bh: number): { hasCollision: boolean; penalty: number } => {
    const worldCenter = localToWorld(targetShape, lx, ly);
    const badgeBox: BoundingBox = {
      minX: worldCenter.x - bw / 2,
      minY: worldCenter.y - bh / 2,
      maxX: worldCenter.x + bw / 2,
      maxY: worldCenter.y + bh / 2,
    };

    let totalPenalty = 0;
    let hasCollision = false;

    for (const { shape: c, box } of colliderBoxes) {
      if (rectsOverlap(badgeBox, box, 2)) {
        hasCollision = true;
        const area = getOverlapArea(badgeBox, box);
        // Prioritize avoiding furniture and interior walls
        const weight = c.category === 'furniture' ? 3 : c.category === 'room' ? 1.5 : 2;
        totalPenalty += area * weight;
      }
    }

    return { hasCollision, penalty: totalPenalty };
  };

  // 1. Test Default Center Position
  const defaultTest = checkBadgeCollision(defaultX, defaultY, badgeWidth, badgeHeight);
  if (!defaultTest.hasCollision) {
    return {
      x: defaultX,
      y: defaultY,
      isDisplaced: false,
      offsetDistance: 0,
      placement: 'center',
    };
  }

  // 2. Center is blocked! Generate rich candidate positions within the shape
  const padX = Math.max(badgeWidth / 2 + 12, w * 0.16);
  const padY = Math.max(badgeHeight / 2 + 12, h * 0.16);

  interface CandidatePos {
    x: number;
    y: number;
    placement: SmartLabelResult['placement'];
    name: string;
  }

  const candidates: CandidatePos[] = [
    // Primary cardinal directions
    { x: w / 2, y: padY, placement: 'north', name: 'north' },
    { x: w / 2, y: h - padY, placement: 'south', name: 'south' },
    { x: padX, y: h / 2, placement: 'west', name: 'west' },
    { x: w - padX, y: h / 2, placement: 'east', name: 'east' },

    // Quadrants (corners)
    { x: padX, y: padY, placement: 'custom', name: 'north-west' },
    { x: w - padX, y: padY, placement: 'custom', name: 'north-east' },
    { x: padX, y: h - padY, placement: 'custom', name: 'south-west' },
    { x: w - padX, y: h - padY, placement: 'custom', name: 'south-east' },

    // Intermediate offsets
    { x: w / 2, y: h * 0.3, placement: 'north', name: 'north-mid' },
    { x: w / 2, y: h * 0.7, placement: 'south', name: 'south-mid' },
    { x: w * 0.3, y: h / 2, placement: 'west', name: 'west-mid' },
    { x: w * 0.7, y: h / 2, placement: 'east', name: 'east-mid' },
    { x: w * 0.32, y: h * 0.32, placement: 'custom', name: 'inner-nw' },
    { x: w * 0.68, y: h * 0.32, placement: 'custom', name: 'inner-ne' },
    { x: w * 0.32, y: h * 0.68, placement: 'custom', name: 'inner-sw' },
    { x: w * 0.68, y: h * 0.68, placement: 'custom', name: 'inner-se' },
  ];

  let bestCand: CandidatePos | null = null;
  let minScore = Infinity;

  for (const cand of candidates) {
    // Keep strictly within room boundary with safe padding
    if (
      cand.x < badgeWidth / 2 + 6 ||
      cand.x > w - badgeWidth / 2 - 6 ||
      cand.y < badgeHeight / 2 + 6 ||
      cand.y > h - badgeHeight / 2 - 6
    ) {
      continue;
    }

    const { hasCollision, penalty } = checkBadgeCollision(cand.x, cand.y, badgeWidth, badgeHeight);
    const distFromCenter = Math.hypot(cand.x - defaultX, cand.y - defaultY);

    // If completely clear, score is just the distance from center (closest to center wins)
    // If collision exists, high penalty added
    const score = hasCollision ? 500000 + penalty * 10 + distFromCenter : distFromCenter;

    if (score < minScore) {
      minScore = score;
      bestCand = cand;
    }
  }

  if (bestCand) {
    const dist = Math.hypot(bestCand.x - defaultX, bestCand.y - defaultY);
    const isDisplaced = dist > 6;

    let leaderLine = undefined;
    // If displaced significantly (> 28px), provide subtle connecting leader line
    if (isDisplaced && dist > 28) {
      leaderLine = {
        x1: defaultX,
        y1: defaultY,
        x2: bestCand.x,
        y2: bestCand.y,
      };
    }

    return {
      x: Math.round(bestCand.x * 10) / 10,
      y: Math.round(bestCand.y * 10) / 10,
      isDisplaced,
      offsetDistance: dist,
      placement: bestCand.placement,
      leaderLine,
    };
  }

  return {
    x: defaultX,
    y: defaultY,
    isDisplaced: false,
    offsetDistance: 0,
    placement: 'center',
  };
}

/**
 * Dynamically calculates position for outer dimension badges (width on top/bottom, height on left/right).
 * When another room or wall abuts or touches the top/left edge, the dimension badge automatically
 * flips inside the shape or flips to the opposing clear outer edge so dimension numbers remain clean and readable.
 */
export function calculateSmartDimensionBadges(
  targetShape: CADShape,
  allShapes: CADShape[],
  enabled: boolean = true
): SmartDimensionBadgesResult {
  const w = targetShape.width;
  const h = targetShape.height;

  const defaultWidthBadge = {
    x: w / 2,
    y: -9,
    isFlipped: false,
    placement: 'top-outer' as const,
  };

  const defaultHeightBadge = {
    x: -12,
    y: h / 2,
    isFlipped: false,
    placement: 'left-outer' as const,
  };

  if (!enabled || w <= 0 || h <= 0) {
    return {
      widthBadge: defaultWidthBadge,
      heightBadge: defaultHeightBadge,
    };
  }

  // Pre-filter candidate colliders
  const candidateColliders = allShapes.filter(
    (other) => other.id !== targetShape.id && other.width > 0 && other.height > 0
  );

  if (candidateColliders.length === 0) {
    return {
      widthBadge: defaultWidthBadge,
      heightBadge: defaultHeightBadge,
    };
  }

  const colliderBoxes = candidateColliders.map((c) => ({
    shape: c,
    box: computeShapeAABB(c),
  }));

  const checkCollision = (lx: number, ly: number, bw: number, bh: number): boolean => {
    const worldPt = localToWorld(targetShape, lx, ly);
    const box: BoundingBox = {
      minX: worldPt.x - bw / 2,
      minY: worldPt.y - bh / 2,
      maxX: worldPt.x + bw / 2,
      maxY: worldPt.y + bh / 2,
    };

    for (const { box: candBox } of colliderBoxes) {
      if (rectsOverlap(box, candBox, 2)) {
        return true;
      }
    }
    return false;
  };

  // --- 1. Evaluate Width Badge (Nominally Top-Outer) ---
  const badgeW = 46;
  const badgeH = 16;

  interface WidthCand {
    x: number;
    y: number;
    placement: SmartDimensionBadgesResult['widthBadge']['placement'];
    isFlipped: boolean;
  }

  const widthCandidates: WidthCand[] = [
    { x: w / 2, y: -9, placement: 'top-outer', isFlipped: false },
    { x: w / 2, y: 14, placement: 'top-inner', isFlipped: true },
    { x: w / 2, y: h + 13, placement: 'bottom-outer', isFlipped: true },
    { x: w / 2, y: h - 14, placement: 'bottom-inner', isFlipped: true },
    { x: w * 0.25, y: -9, placement: 'top-outer', isFlipped: false },
    { x: w * 0.75, y: -9, placement: 'top-outer', isFlipped: false },
    { x: w * 0.25, y: 14, placement: 'top-inner', isFlipped: true },
    { x: w * 0.75, y: 14, placement: 'top-inner', isFlipped: true },
  ];

  let bestWidthBadge = widthCandidates[0];
  for (const cand of widthCandidates) {
    if (!checkCollision(cand.x, cand.y, badgeW, badgeH)) {
      bestWidthBadge = cand;
      break;
    }
  }

  // --- 2. Evaluate Height Badge (Nominally Left-Outer) ---
  interface HeightCand {
    x: number;
    y: number;
    placement: SmartDimensionBadgesResult['heightBadge']['placement'];
    isFlipped: boolean;
  }

  const heightCandidates: HeightCand[] = [
    { x: -12, y: h / 2, placement: 'left-outer', isFlipped: false },
    { x: 18, y: h / 2, placement: 'left-inner', isFlipped: true },
    { x: w + 13, y: h / 2, placement: 'right-outer', isFlipped: true },
    { x: w - 18, y: h / 2, placement: 'right-inner', isFlipped: true },
    { x: -12, y: h * 0.25, placement: 'left-outer', isFlipped: false },
    { x: -12, y: h * 0.75, placement: 'left-outer', isFlipped: false },
    { x: 18, y: h * 0.25, placement: 'left-inner', isFlipped: true },
    { x: 18, y: h * 0.75, placement: 'left-inner', isFlipped: true },
  ];

  let bestHeightBadge = heightCandidates[0];
  for (const cand of heightCandidates) {
    if (!checkCollision(cand.x, cand.y, badgeW, badgeH)) {
      bestHeightBadge = cand;
      break;
    }
  }

  return {
    widthBadge: {
      x: Math.round(bestWidthBadge.x),
      y: Math.round(bestWidthBadge.y),
      isFlipped: bestWidthBadge.isFlipped,
      placement: bestWidthBadge.placement,
    },
    heightBadge: {
      x: Math.round(bestHeightBadge.x),
      y: Math.round(bestHeightBadge.y),
      isFlipped: bestHeightBadge.isFlipped,
      placement: bestHeightBadge.placement,
    },
  };
}

/**
 * Calculates dynamic collision-free text placement for standalone dimension lines.
 */
export function calculateSmartDimensionLineText(
  shape: CADShape,
  allShapes: CADShape[],
  enabled: boolean = true
): { x: number; y: number; isFlipped: boolean } {
  const w = shape.width;
  const h = shape.height;
  const defaultPos = { x: w / 2, y: h / 2 - 5, isFlipped: false };

  if (!enabled) return defaultPos;

  const candidateColliders = allShapes.filter(
    (other) => other.id !== shape.id && other.width > 0 && other.height > 0
  );
  if (candidateColliders.length === 0) return defaultPos;

  const colliderBoxes = candidateColliders.map((c) => ({
    box: computeShapeAABB(c),
  }));

  const check = (lx: number, ly: number): boolean => {
    const worldPt = localToWorld(shape, lx, ly);
    const box: BoundingBox = {
      minX: worldPt.x - 22,
      minY: worldPt.y - 8,
      maxX: worldPt.x + 22,
      maxY: worldPt.y + 8,
    };
    for (const { box: candBox } of colliderBoxes) {
      if (rectsOverlap(box, candBox, 2)) return true;
    }
    return false;
  };

  if (!check(defaultPos.x, defaultPos.y)) {
    return defaultPos;
  }

  // Flipped below dimension line
  if (!check(w / 2, h / 2 + 13)) {
    return { x: w / 2, y: h / 2 + 13, isFlipped: true };
  }

  // Offset left
  if (!check(w * 0.25, h / 2 - 5)) {
    return { x: w * 0.25, y: h / 2 - 5, isFlipped: false };
  }

  // Offset right
  if (!check(w * 0.75, h / 2 - 5)) {
    return { x: w * 0.75, y: h / 2 - 5, isFlipped: false };
  }

  return defaultPos;
}
