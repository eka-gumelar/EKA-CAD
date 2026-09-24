import { CADShape, SmartGuide, WallJoinSegment, DistanceIndicator, Unit } from '../types/cad';
import { formatDistance } from './units';

export interface AlignmentResult {
  snappedX: number;
  snappedY: number;
  guides: SmartGuide[];
  hasWallJoinSnap: boolean;
}

export interface ResizeAlignmentResult {
  snappedX: number;
  snappedY: number;
  snappedWidth: number;
  snappedHeight: number;
  guides: SmartGuide[];
}

/**
 * Calculates smart alignment guides and snaps positions when dragging an object
 */
export function calculateDragAlignment(
  targetShape: CADShape,
  candidateShapes: CADShape[],
  snapThreshold: number = 8,
  enableWallJoin: boolean = true
): AlignmentResult {
  let snappedX = targetShape.x;
  let snappedY = targetShape.y;
  const guides: SmartGuide[] = [];
  let hasWallJoinSnap = false;

  const targetW = targetShape.width;
  const targetH = targetShape.height;

  let bestDeltaX = snapThreshold + 1;
  let bestDeltaY = snapThreshold + 1;
  let bestGuideX: SmartGuide | null = null;
  let bestGuideY: SmartGuide | null = null;

  const isTargetWall = targetShape.category === 'room' || targetShape.category === 'wall' || targetShape.layer === 'WALLS';

  for (const cand of candidateShapes) {
    if (cand.id === targetShape.id) continue;

    const candL = cand.x;
    const candC = cand.x + cand.width / 2;
    const candR = cand.x + cand.width;

    const candT = cand.y;
    const candM = cand.y + cand.height / 2;
    const candB = cand.y + cand.height;

    const isCandWall = cand.category === 'room' || cand.category === 'wall' || cand.layer === 'WALLS';

    // --- VERTICAL ALIGNMENT (X-AXIS) ---
    // 1. Left to Left
    const diffLtoL = candL - targetShape.x;
    if (Math.abs(diffLtoL) < Math.abs(bestDeltaX)) {
      bestDeltaX = diffLtoL;
      snappedX = candL;
      bestGuideX = {
        id: `guide-vl-${cand.id}`,
        type: 'vertical',
        position: candL,
        start: Math.min(targetShape.y, candT) - 20,
        end: Math.max(targetShape.y + targetH, candB) + 20,
        label: 'Rata Kiri',
        snapKind: 'edge',
      };
    }

    // 2. Right to Right
    const diffRtoR = candR - (targetShape.x + targetW);
    if (Math.abs(diffRtoR) < Math.abs(bestDeltaX)) {
      bestDeltaX = diffRtoR;
      snappedX = candR - targetW;
      bestGuideX = {
        id: `guide-vr-${cand.id}`,
        type: 'vertical',
        position: candR,
        start: Math.min(targetShape.y, candT) - 20,
        end: Math.max(targetShape.y + targetH, candB) + 20,
        label: 'Rata Kanan',
        snapKind: 'edge',
      };
    }

    // 3. Center to Center
    const currentTargetC = targetShape.x + targetW / 2;
    const diffCtoC = candC - currentTargetC;
    if (Math.abs(diffCtoC) < Math.abs(bestDeltaX)) {
      bestDeltaX = diffCtoC;
      snappedX = candC - targetW / 2;
      bestGuideX = {
        id: `guide-vc-${cand.id}`,
        type: 'vertical',
        position: candC,
        start: Math.min(targetShape.y, candT) - 20,
        end: Math.max(targetShape.y + targetH, candB) + 20,
        label: 'Tengah Sejajar',
        snapKind: 'center',
      };
    }

    // 4. Wall Abutment / Wall-Join: Left to Right
    if (enableWallJoin && isTargetWall && isCandWall) {
      const diffLtoR = candR - targetShape.x;
      if (Math.abs(diffLtoR) < Math.abs(bestDeltaX) && Math.abs(diffLtoR) <= snapThreshold * 1.5) {
        bestDeltaX = diffLtoR;
        snappedX = candR;
        hasWallJoinSnap = true;
        bestGuideX = {
          id: `guide-wall-lr-${cand.id}`,
          type: 'vertical',
          position: candR,
          start: Math.min(targetShape.y, candT) - 15,
          end: Math.max(targetShape.y + targetH, candB) + 15,
          label: 'Sambung Dinding (Wall-Join)',
          snapKind: 'wall_abut',
        };
      }

      // Right to Left
      const diffRtoL = candL - (targetShape.x + targetW);
      if (Math.abs(diffRtoL) < Math.abs(bestDeltaX) && Math.abs(diffRtoL) <= snapThreshold * 1.5) {
        bestDeltaX = diffRtoL;
        snappedX = candL - targetW;
        hasWallJoinSnap = true;
        bestGuideX = {
          id: `guide-wall-rl-${cand.id}`,
          type: 'vertical',
          position: candL,
          start: Math.min(targetShape.y, candT) - 15,
          end: Math.max(targetShape.y + targetH, candB) + 15,
          label: 'Sambung Dinding (Wall-Join)',
          snapKind: 'wall_abut',
        };
      }
    }

    // --- HORIZONTAL ALIGNMENT (Y-AXIS) ---
    // 1. Top to Top
    const diffTtoT = candT - targetShape.y;
    if (Math.abs(diffTtoT) < Math.abs(bestDeltaY)) {
      bestDeltaY = diffTtoT;
      snappedY = candT;
      bestGuideY = {
        id: `guide-ht-${cand.id}`,
        type: 'horizontal',
        position: candT,
        start: Math.min(targetShape.x, candL) - 20,
        end: Math.max(targetShape.x + targetW, candR) + 20,
        label: 'Rata Atas',
        snapKind: 'edge',
      };
    }

    // 2. Bottom to Bottom
    const diffBtoB = candB - (targetShape.y + targetH);
    if (Math.abs(diffBtoB) < Math.abs(bestDeltaY)) {
      bestDeltaY = diffBtoB;
      snappedY = candB - targetH;
      bestGuideY = {
        id: `guide-hb-${cand.id}`,
        type: 'horizontal',
        position: candB,
        start: Math.min(targetShape.x, candL) - 20,
        end: Math.max(targetShape.x + targetW, candR) + 20,
        label: 'Rata Bawah',
        snapKind: 'edge',
      };
    }

    // 3. Middle to Middle
    const currentTargetM = targetShape.y + targetH / 2;
    const diffMtoM = candM - currentTargetM;
    if (Math.abs(diffMtoM) < Math.abs(bestDeltaY)) {
      bestDeltaY = diffMtoM;
      snappedY = candM - targetH / 2;
      bestGuideY = {
        id: `guide-hm-${cand.id}`,
        type: 'horizontal',
        position: candM,
        start: Math.min(targetShape.x, candL) - 20,
        end: Math.max(targetShape.x + targetW, candR) + 20,
        label: 'Tengah Horizontal',
        snapKind: 'center',
      };
    }

    // 4. Wall Abutment / Wall-Join: Top to Bottom
    if (enableWallJoin && isTargetWall && isCandWall) {
      const diffTtoB = candB - targetShape.y;
      if (Math.abs(diffTtoB) < Math.abs(bestDeltaY) && Math.abs(diffTtoB) <= snapThreshold * 1.5) {
        bestDeltaY = diffTtoB;
        snappedY = candB;
        hasWallJoinSnap = true;
        bestGuideY = {
          id: `guide-wall-tb-${cand.id}`,
          type: 'horizontal',
          position: candB,
          start: Math.min(targetShape.x, candL) - 15,
          end: Math.max(targetShape.x + targetW, candR) + 15,
          label: 'Sambung Dinding (Wall-Join)',
          snapKind: 'wall_abut',
        };
      }

      // Bottom to Top
      const diffBtoT = candT - (targetShape.y + targetH);
      if (Math.abs(diffBtoT) < Math.abs(bestDeltaY) && Math.abs(diffBtoT) <= snapThreshold * 1.5) {
        bestDeltaY = diffBtoT;
        snappedY = candT - targetH;
        hasWallJoinSnap = true;
        bestGuideY = {
          id: `guide-wall-bt-${cand.id}`,
          type: 'horizontal',
          position: candT,
          start: Math.min(targetShape.x, candL) - 15,
          end: Math.max(targetShape.x + targetW, candR) + 15,
          label: 'Sambung Dinding (Wall-Join)',
          snapKind: 'wall_abut',
        };
      }
    }
  }

  if (bestGuideX && Math.abs(bestDeltaX) <= snapThreshold * 1.5) {
    guides.push(bestGuideX);
  } else {
    snappedX = targetShape.x;
  }

  if (bestGuideY && Math.abs(bestDeltaY) <= snapThreshold * 1.5) {
    guides.push(bestGuideY);
  } else {
    snappedY = targetShape.y;
  }

  return { snappedX, snappedY, guides, hasWallJoinSnap };
}

/**
 * Calculates smart guides when resizing an object from handles
 */
export function calculateResizeAlignment(
  targetX: number,
  targetY: number,
  targetW: number,
  targetH: number,
  handle: string,
  candidateShapes: CADShape[],
  snapThreshold: number = 8
): ResizeAlignmentResult {
  let resX = targetX;
  let resY = targetY;
  let resW = targetW;
  let resH = targetH;
  const guides: SmartGuide[] = [];

  for (const cand of candidateShapes) {
    const candL = cand.x;
    const candR = cand.x + cand.width;
    const candT = cand.y;
    const candB = cand.y + cand.height;

    // Resizing East (Right edge)
    if (handle.includes('e')) {
      const curR = targetX + targetW;
      if (Math.abs(curR - candL) <= snapThreshold) {
        resW = Math.max(10, candL - targetX);
        guides.push({
          id: `resize-el-${cand.id}`,
          type: 'vertical',
          position: candL,
          start: Math.min(targetY, candT) - 15,
          end: Math.max(targetY + targetH, candB) + 15,
          label: 'Sejajar Tepi',
        });
      } else if (Math.abs(curR - candR) <= snapThreshold) {
        resW = Math.max(10, candR - targetX);
        guides.push({
          id: `resize-er-${cand.id}`,
          type: 'vertical',
          position: candR,
          start: Math.min(targetY, candT) - 15,
          end: Math.max(targetY + targetH, candB) + 15,
          label: 'Sama Lebar',
        });
      }
    }

    // Resizing South (Bottom edge)
    if (handle.includes('s')) {
      const curB = targetY + targetH;
      if (Math.abs(curB - candT) <= snapThreshold) {
        resH = Math.max(10, candT - targetY);
        guides.push({
          id: `resize-st-${cand.id}`,
          type: 'horizontal',
          position: candT,
          start: Math.min(targetX, candL) - 15,
          end: Math.max(targetX + targetW, candR) + 15,
          label: 'Sejajar Bawah',
        });
      } else if (Math.abs(curB - candB) <= snapThreshold) {
        resH = Math.max(10, candB - targetY);
        guides.push({
          id: `resize-sb-${cand.id}`,
          type: 'horizontal',
          position: candB,
          start: Math.min(targetX, candL) - 15,
          end: Math.max(targetX + targetW, candR) + 15,
          label: 'Sama Tinggi',
        });
      }
    }
  }

  return {
    snappedX: resX,
    snappedY: resY,
    snappedWidth: resW,
    snappedHeight: resH,
    guides,
  };
}

/**
 * Detects adjacent or touching walls/rooms to render clean architectural wall joins
 * (eliminates ugly dividing lines between adjacent wall cores, creating seamless monolithic joins)
 */
export function detectWallJoins(shapes: CADShape[]): WallJoinSegment[] {
  const joins: WallJoinSegment[] = [];
  const wallShapes = shapes.filter(
    (s) => s.category === 'room' || s.category === 'wall' || s.layer === 'WALLS'
  );

  const tolerance = 6; // pixels tolerance for touching walls

  for (let i = 0; i < wallShapes.length; i++) {
    const a = wallShapes[i];
    const aL = a.x;
    const aR = a.x + a.width;
    const aT = a.y;
    const aB = a.y + a.height;

    for (let j = i + 1; j < wallShapes.length; j++) {
      const b = wallShapes[j];
      const bL = b.x;
      const bR = b.x + b.width;
      const bT = b.y;
      const bB = b.y + b.height;

      // 1. Vertical wall touching: A's right touches B's left
      const vTouchAtoB = Math.abs(aR - bL) <= tolerance;
      const vOverlapY = Math.min(aB, bB) - Math.max(aT, bT);

      if (vTouchAtoB && vOverlapY > 12) {
        const overlapStart = Math.max(aT, bT);
        const overlapHeight = vOverlapY;
        const seamX = (aR + bL) / 2;
        const thickness = Math.max(8, (a.strokeWidth || 3) * 3);

        joins.push({
          id: `join-v-${a.id}-${b.id}`,
          x: seamX - thickness / 2,
          y: overlapStart + 1,
          width: thickness,
          height: Math.max(10, overlapHeight - 2),
          type: 'vertical',
          strokeColor: a.strokeColor || '#0f172a',
          fillColor: a.fillColor || '#ffffff',
        });
      }

      // Vertical wall touching: B's right touches A's left
      const vTouchBtoA = Math.abs(bR - aL) <= tolerance;
      if (vTouchBtoA && vOverlapY > 12) {
        const overlapStart = Math.max(aT, bT);
        const overlapHeight = vOverlapY;
        const seamX = (bR + aL) / 2;
        const thickness = Math.max(8, (b.strokeWidth || 3) * 3);

        joins.push({
          id: `join-v-${b.id}-${a.id}`,
          x: seamX - thickness / 2,
          y: overlapStart + 1,
          width: thickness,
          height: Math.max(10, overlapHeight - 2),
          type: 'vertical',
          strokeColor: b.strokeColor || '#0f172a',
          fillColor: b.fillColor || '#ffffff',
        });
      }

      // 2. Horizontal wall touching: A's bottom touches B's top
      const hTouchAtoB = Math.abs(aB - bT) <= tolerance;
      const hOverlapX = Math.min(aR, bR) - Math.max(aL, bL);

      if (hTouchAtoB && hOverlapX > 12) {
        const overlapStart = Math.max(aL, bL);
        const overlapWidth = hOverlapX;
        const seamY = (aB + bT) / 2;
        const thickness = Math.max(8, (a.strokeWidth || 3) * 3);

        joins.push({
          id: `join-h-${a.id}-${b.id}`,
          x: overlapStart + 1,
          y: seamY - thickness / 2,
          width: Math.max(10, overlapWidth - 2),
          height: thickness,
          type: 'horizontal',
          strokeColor: a.strokeColor || '#0f172a',
          fillColor: a.fillColor || '#ffffff',
        });
      }

      // Horizontal wall touching: B's bottom touches A's top
      const hTouchBtoA = Math.abs(bB - aT) <= tolerance;
      if (hTouchBtoA && hOverlapX > 12) {
        const overlapStart = Math.max(aL, bL);
        const overlapWidth = hOverlapX;
        const seamY = (bB + aT) / 2;
        const thickness = Math.max(8, (b.strokeWidth || 3) * 3);

        joins.push({
          id: `join-h-${b.id}-${a.id}`,
          x: overlapStart + 1,
          y: seamY - thickness / 2,
          width: Math.max(10, overlapWidth - 2),
          height: thickness,
          type: 'horizontal',
          strokeColor: b.strokeColor || '#0f172a',
          fillColor: b.fillColor || '#ffffff',
        });
      }
    }
  }

  return joins;
}

/**
 * Calculates dynamic distance indicators between the moving/selected shape and the nearest colliders
 * (neighboring shapes, adjacent rooms, furniture, or enclosing room walls).
 */
export function calculateColliderDistances(
  targetShape: CADShape,
  candidateShapes: CADShape[],
  pixelsPerMeter: number,
  unit: Unit,
  maxDistanceMeters: number = 10.0
): DistanceIndicator[] {
  const indicators: DistanceIndicator[] = [];
  if (!targetShape || targetShape.width <= 0 || targetShape.height <= 0) return indicators;

  const tL = targetShape.x;
  const tR = targetShape.x + targetShape.width;
  const tT = targetShape.y;
  const tB = targetShape.y + targetShape.height;
  const tMidX = (tL + tR) / 2;
  const tMidY = (tT + tB) / 2;

  const maxDistPx = maxDistanceMeters * pixelsPerMeter;

  // Filter valid colliders
  const validColliders = candidateShapes.filter(
    (c) => c.id !== targetShape.id && c.width > 0 && c.height > 0
  );
  if (validColliders.length === 0) return indicators;

  // 1. Check if target is inside an enclosing container (e.g. inside a room)
  let enclosingContainer: CADShape | null = null;
  let minEnclosingArea = Infinity;

  for (const cand of validColliders) {
    const cL = cand.x;
    const cR = cand.x + cand.width;
    const cT = cand.y;
    const cB = cand.y + cand.height;

    // Is target within cand?
    if (cL <= tL + 2 && cR >= tR - 2 && cT <= tT + 2 && cB >= tB - 2) {
      const area = cand.width * cand.height;
      if (area < minEnclosingArea) {
        minEnclosingArea = area;
        enclosingContainer = cand;
      }
    }
  }

  interface DirectionCandidate {
    distance: number;
    cand: CADShape;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    isEnclosing: boolean;
  }

  let bestLeft: DirectionCandidate | null = null;
  let bestRight: DirectionCandidate | null = null;
  let bestTop: DirectionCandidate | null = null;
  let bestBottom: DirectionCandidate | null = null;

  // Check enclosing walls first if present
  if (enclosingContainer) {
    const enc = enclosingContainer;
    const encL = enc.x;
    const encR = enc.x + enc.width;
    const encT = enc.y;
    const encB = enc.y + enc.height;

    // Left wall distance
    const distL = tL - encL;
    if (distL >= 2 && distL <= maxDistPx) {
      bestLeft = {
        distance: distL,
        cand: enc,
        x1: encL,
        y1: tMidY,
        x2: tL,
        y2: tMidY,
        isEnclosing: true,
      };
    }

    // Right wall distance
    const distR = encR - tR;
    if (distR >= 2 && distR <= maxDistPx) {
      bestRight = {
        distance: distR,
        cand: enc,
        x1: tR,
        y1: tMidY,
        x2: encR,
        y2: tMidY,
        isEnclosing: true,
      };
    }

    // Top wall distance
    const distT = tT - encT;
    if (distT >= 2 && distT <= maxDistPx) {
      bestTop = {
        distance: distT,
        cand: enc,
        x1: tMidX,
        y1: encT,
        x2: tMidX,
        y2: tT,
        isEnclosing: true,
      };
    }

    // Bottom wall distance
    const distB = encB - tB;
    if (distB >= 2 && distB <= maxDistPx) {
      bestBottom = {
        distance: distB,
        cand: enc,
        x1: tMidX,
        y1: tB,
        x2: tMidX,
        y2: encB,
        isEnclosing: true,
      };
    }
  }

  // 2. Check all other colliders (obstacles, adjacent shapes, neighboring rooms)
  for (const cand of validColliders) {
    if (enclosingContainer && cand.id === enclosingContainer.id) continue;

    const cL = cand.x;
    const cR = cand.x + cand.width;
    const cT = cand.y;
    const cB = cand.y + cand.height;

    // Vertical overlap for horizontal measurements
    const vOverlapStart = Math.max(tT, cT);
    const vOverlapEnd = Math.min(tB, cB);
    const hasVOverlap = vOverlapEnd > vOverlapStart;
    const measureY = hasVOverlap ? (vOverlapStart + vOverlapEnd) / 2 : tMidY;

    // Horizontal overlap for vertical measurements
    const hOverlapStart = Math.max(tL, cL);
    const hOverlapEnd = Math.min(tR, cR);
    const hasHOverlap = hOverlapEnd > hOverlapStart;
    const measureX = hasHOverlap ? (hOverlapStart + hOverlapEnd) / 2 : tMidX;

    // --- LEFT COLLIDER (Candidate is to the left of target: cR <= tL) ---
    if (cR <= tL) {
      const dist = tL - cR;
      const penalty = hasVOverlap ? 0 : Math.min(Math.abs(cT - tB), Math.abs(cB - tT)) * 0.4;
      const score = dist + penalty;

      if (dist >= 2 && dist <= maxDistPx) {
        if (!bestLeft || score < bestLeft.distance) {
          bestLeft = {
            distance: dist,
            cand,
            x1: cR,
            y1: measureY,
            x2: tL,
            y2: measureY,
            isEnclosing: false,
          };
        }
      }
    }

    // --- RIGHT COLLIDER (Candidate is to the right of target: cL >= tR) ---
    if (cL >= tR) {
      const dist = cL - tR;
      const penalty = hasVOverlap ? 0 : Math.min(Math.abs(cT - tB), Math.abs(cB - tT)) * 0.4;
      const score = dist + penalty;

      if (dist >= 2 && dist <= maxDistPx) {
        if (!bestRight || score < bestRight.distance) {
          bestRight = {
            distance: dist,
            cand,
            x1: tR,
            y1: measureY,
            x2: cL,
            y2: measureY,
            isEnclosing: false,
          };
        }
      }
    }

    // --- TOP COLLIDER (Candidate is above target: cB <= tT) ---
    if (cB <= tT) {
      const dist = tT - cB;
      const penalty = hasHOverlap ? 0 : Math.min(Math.abs(cL - tR), Math.abs(cR - tL)) * 0.4;
      const score = dist + penalty;

      if (dist >= 2 && dist <= maxDistPx) {
        if (!bestTop || score < bestTop.distance) {
          bestTop = {
            distance: dist,
            cand,
            x1: measureX,
            y1: cB,
            x2: measureX,
            y2: tT,
            isEnclosing: false,
          };
        }
      }
    }

    // --- BOTTOM COLLIDER (Candidate is below target: cT >= tB) ---
    if (cT >= tB) {
      const dist = cT - tB;
      const penalty = hasHOverlap ? 0 : Math.min(Math.abs(cL - tR), Math.abs(cR - tL)) * 0.4;
      const score = dist + penalty;

      if (dist >= 2 && dist <= maxDistPx) {
        if (!bestBottom || score < bestBottom.distance) {
          bestBottom = {
            distance: dist,
            cand,
            x1: measureX,
            y1: tB,
            x2: measureX,
            y2: cT,
            isEnclosing: false,
          };
        }
      }
    }
  }

  // Convert best candidates to DistanceIndicator array
  const list: { dir: 'left' | 'right' | 'top' | 'bottom'; item: DirectionCandidate | null }[] = [
    { dir: 'left', item: bestLeft },
    { dir: 'right', item: bestRight },
    { dir: 'top', item: bestTop },
    { dir: 'bottom', item: bestBottom },
  ];

  for (const { dir, item } of list) {
    if (!item) continue;
    const formatted = formatDistance(item.distance, pixelsPerMeter, unit, 2);
    indicators.push({
      id: `dist-${dir}-${item.cand.id}`,
      axis: dir === 'left' || dir === 'right' ? 'x' : 'y',
      x1: item.x1,
      y1: item.y1,
      x2: item.x2,
      y2: item.y2,
      distancePx: item.distance,
      distanceFormatted: formatted,
      direction: dir,
      colliderName: item.cand.name,
      isEnclosingWall: item.isEnclosing,
    });
  }

  return indicators;
}
