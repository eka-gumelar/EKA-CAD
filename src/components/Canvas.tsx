import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  CADShape,
  GridSettings,
  Point,
  ScaleSettings,
  LayerItem,
  MouseSensitivitySettings,
  SmartGuide,
  WallJoinSegment,
  DistanceIndicator,
} from '../types/cad';
import { CanvasTheme } from './Toolbar';
import {
  calculateShapeAreaM2,
  formatArea,
  formatDistance,
  pxToMeters,
  snapToGrid,
  distanceBetween,
} from '../utils/units';
import {
  calculateDragAlignment,
  calculateResizeAlignment,
  detectWallJoins,
  calculateColliderDistances,
} from '../utils/cadAlignment';
import {
  calculateSmartCenterLabelPosition,
  calculateSmartDimensionBadges,
  calculateSmartDimensionLineText,
} from '../utils/cadSmartLabels';
import { InitialRoomCard } from './InitialRoomCard';
import { ZoomControlWidget } from './ZoomControlWidget';
import {
  Ruler,
  LayoutTemplate,
  HelpCircle,
  PenTool,
  Sparkles,
} from 'lucide-react';

interface CanvasProps {
  shapes: CADShape[];
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  onUpdateShape: (shape: CADShape) => void;
  onCommitShapeUpdate?: (shape: CADShape, description: string) => void;
  scaleSettings: ScaleSettings;
  gridSettings: GridSettings;
  layers?: LayerItem[];
  activeTool: 'select' | 'polygon' | 'pan';
  canvasTheme: CanvasTheme;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  panOffset: Point;
  onPanChange: (newPan: Point) => void;
  onCursorMove: (pos: Point | null) => void;
  // Custom Polygon Drawing
  isDrawingPolygon: boolean;
  polygonPoints: Point[];
  onAddPolygonPoint: (pt: Point) => void;
  onFinishPolygon: () => void;
  onCancelPolygon: () => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  // Beginner Friendly Empty Canvas Handlers
  onOpenTemplates?: () => void;
  onOpenGuide?: () => void;
  onQuickAddRoom?: () => void;
  onStartDrawingPolygon?: () => void;
  onOpenContextMenu?: (screenX: number, screenY: number, canvasPoint: Point, shape: CADShape | null) => void;
  // Mouse Sensitivity & Navigation Settings
  sensitivitySettings: MouseSensitivitySettings;
  onUpdateSensitivity: (newSettings: MouseSensitivitySettings) => void;
  onCreateBaseRoom?: (params: {
    name: string;
    widthUnit: number;
    heightUnit: number;
    roomShape: 'rect_room' | 'l_room';
    wallThicknessUnit: number;
  }) => void;
  onFitView?: () => void;
  onOpenInspector?: () => void;
}

type DragHandleType = 'body' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rot' | 'vertex';

export const Canvas: React.FC<CanvasProps> = ({
  shapes,
  selectedShapeId,
  onSelectShape,
  onUpdateShape,
  onCommitShapeUpdate,
  scaleSettings,
  gridSettings,
  layers = [],
  activeTool,
  canvasTheme,
  zoom,
  onZoomChange,
  panOffset,
  onPanChange,
  onCursorMove,
  isDrawingPolygon,
  polygonPoints,
  onAddPolygonPoint,
  onFinishPolygon,
  onCancelPolygon,
  svgRef,
  onOpenTemplates,
  onOpenGuide,
  onQuickAddRoom,
  onStartDrawingPolygon,
  onOpenContextMenu,
  sensitivitySettings,
  onUpdateSensitivity,
  onCreateBaseRoom,
  onFitView,
  onOpenInspector,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragHandle, setDragHandle] = useState<DragHandleType | null>(null);
  const [dragStartMouse, setDragStartMouse] = useState<Point>({ x: 0, y: 0 });
  const [initialShapeState, setInitialShapeState] = useState<CADShape | null>(null);
  const [dragVertexIndex, setDragVertexIndex] = useState<number | null>(null);

  // Smart Guides & Wall Join dynamic alignment state
  const [activeSmartGuides, setActiveSmartGuides] = useState<SmartGuide[]>([]);
  const [hasWallJoinActive, setHasWallJoinActive] = useState<boolean>(false);

  // Dynamic Distance Indicators to nearest colliders & surrounding room walls
  const [activeDistanceIndicators, setActiveDistanceIndicators] = useState<DistanceIndicator[]>([]);
  const distanceTimerRef = useRef<any>(null);

  // Pan with spacebar
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStartMouse, setPanStartMouse] = useState<Point>({ x: 0, y: 0 });
  const [panStartOffset, setPanStartOffset] = useState<Point>({ x: 0, y: 0 });

  // Current hovered mouse point in canvas space
  const [canvasMouse, setCanvasMouse] = useState<Point>({ x: 0, y: 0 });

  const selectedShape = useMemo(() => {
    return shapes.find((s) => s.id === selectedShapeId) || null;
  }, [shapes, selectedShapeId]);

  // Layer checks
  const isShapeVisible = (shape: CADShape): boolean => {
    if (!layers || layers.length === 0) return true;
    const layer = layers.find((l) => l.id === shape.layerId || l.cadLayerName === shape.layer);
    return !layer || layer.visible !== false;
  };

  const isShapeLocked = (shape: CADShape | null): boolean => {
    if (!shape || !layers || layers.length === 0) return false;
    const layer = layers.find((l) => l.id === shape.layerId || l.cadLayerName === shape.layer);
    return !!layer && layer.locked === true;
  };

  // Screen to Canvas coordinate transform
  const screenToCanvas = (screenX: number, screenY: number): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = screenX - rect.left;
    const rawY = screenY - rect.top;
    return {
      x: (rawX - panOffset.x) / zoom,
      y: (rawY - panOffset.y) / zoom,
    };
  };

  // Keyboard events (Spacebar for pan, Escape for cancel, Arrow keys for precise nudging)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
      if (e.key === 'Escape') {
        if (isDrawingPolygon) onCancelPolygon();
        else onSelectShape(null);
      }
      if (e.key === 'Enter' && isDrawingPolygon && polygonPoints.length >= 3) {
        onFinishPolygon();
      }

      // Arrow keys nudging selected item with distance indicator to nearest colliders
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
        selectedShape &&
        !isShapeLocked(selectedShape)
      ) {
        e.preventDefault();
        e.stopPropagation();

        // Step size:
        // - Alt: 0.01m (1 cm) micro-nudge (bypasses snap)
        // - Shift: 0.50m (50 cm) macro-nudge
        // - Grid snap active: move by at least 1 grid unit (or 0.1m) so it advances cleanly without snapping back to 0!
        // - Default free nudge: 0.05m (5 cm)
        let stepM = 0.05;
        if (e.altKey) {
          stepM = 0.01;
        } else if (e.shiftKey) {
          stepM = Math.max(0.5, gridSettings.size);
        } else if (gridSettings.snapToGrid) {
          stepM = Math.max(0.1, gridSettings.size);
        }

        const stepPx = stepM * scaleSettings.pixelsPerMeter;

        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowLeft') dx = -stepPx;
        if (e.key === 'ArrowRight') dx = stepPx;
        if (e.key === 'ArrowUp') dy = -stepPx;
        if (e.key === 'ArrowDown') dy = stepPx;

        let newX = selectedShape.x + dx;
        let newY = selectedShape.y + dy;

        if (gridSettings.snapToGrid && !e.altKey) {
          newX = snapToGrid(newX, gridSettings.size, scaleSettings.pixelsPerMeter);
          newY = snapToGrid(newY, gridSettings.size, scaleSettings.pixelsPerMeter);
        }

        const updated: CADShape = {
          ...selectedShape,
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
        };

        if (onCommitShapeUpdate) {
          onCommitShapeUpdate(updated, `Geser ${selectedShape.name} (${Math.round(stepM * 100)} cm)`);
        } else {
          onUpdateShape(updated);
        }

        // Calculate and show distance indicators to nearest colliders immediately
        const candidateShapes = shapes.filter((s) => s.id !== selectedShape.id && isShapeVisible(s));
        const dists = calculateColliderDistances(
          updated,
          candidateShapes,
          scaleSettings.pixelsPerMeter,
          scaleSettings.unit
        );
        setActiveDistanceIndicators(dists);

        if (distanceTimerRef.current) clearTimeout(distanceTimerRef.current);
        distanceTimerRef.current = setTimeout(() => {
          setActiveDistanceIndicators([]);
        }, 3000);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isDrawingPolygon,
    polygonPoints,
    onCancelPolygon,
    onFinishPolygon,
    onSelectShape,
    selectedShape,
    shapes,
    layers,
    scaleSettings,
    gridSettings,
    onCommitShapeUpdate,
    onUpdateShape,
  ]);

  // Show distance indicators when selecting a shape
  useEffect(() => {
    if (selectedShape && !isDragging) {
      const candidateShapes = shapes.filter((s) => s.id !== selectedShape.id && isShapeVisible(s));
      const dists = calculateColliderDistances(
        selectedShape,
        candidateShapes,
        scaleSettings.pixelsPerMeter,
        scaleSettings.unit
      );
      setActiveDistanceIndicators(dists);
      if (distanceTimerRef.current) clearTimeout(distanceTimerRef.current);
      distanceTimerRef.current = setTimeout(() => {
        setActiveDistanceIndicators([]);
      }, 2500);
    } else if (!selectedShape) {
      setActiveDistanceIndicators([]);
    }
  }, [selectedShapeId]);

  // Native non-passive wheel listener for smooth laptop pinch-to-zoom (trackpad) and wheel zoom/pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 1. Pinch-to-zoom on laptop trackpad (e.ctrlKey is true during pinch)
      if (e.ctrlKey) {
        const zoomSens = sensitivitySettings?.zoomSensitivity ?? 1.0;
        // deltaY is negative when pinching out (zoom in), positive when pinching in (zoom out)
        const pinchFactor = Math.exp(-e.deltaY * 0.008 * zoomSens);
        const newZoom = Math.min(5.0, Math.max(0.04, Number((zoom * pinchFactor).toFixed(4))));

        const newPanX = mouseX - (mouseX - panOffset.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - panOffset.y) * (newZoom / zoom);

        onPanChange({ x: newPanX, y: newPanY });
        onZoomChange(newZoom);
        return;
      }

      // 2. Trackpad two-finger scroll panning OR holding Space while scrolling
      if (isSpacePressed || e.shiftKey) {
        const panSens = sensitivitySettings?.panSensitivity ?? 1.0;
        onPanChange({
          x: panOffset.x - (e.deltaX || (e.shiftKey ? e.deltaY : 0)) * panSens,
          y: panOffset.y - (e.shiftKey ? 0 : e.deltaY) * panSens,
        });
        return;
      }

      // Horizontal trackpad gesture
      if (Math.abs(e.deltaX) > 0 && Math.abs(e.deltaY) < 5) {
        onPanChange({
          x: panOffset.x - e.deltaX,
          y: panOffset.y - e.deltaY,
        });
        return;
      }

      // 3. Standard mouse wheel zoom
      const zoomSens = sensitivitySettings?.zoomSensitivity ?? 1.0;
      const inverted = sensitivitySettings?.invertWheelZoom ?? false;
      const effectiveDelta = inverted ? -e.deltaY : e.deltaY;
      const step = 0.12 * zoomSens;
      const zoomFactor = effectiveDelta < 0 ? 1 + step : Math.max(0.1, 1 - step);
      const newZoom = Math.min(5.0, Math.max(0.04, Number((zoom * zoomFactor).toFixed(3))));

      const newPanX = mouseX - (mouseX - panOffset.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - panOffset.y) * (newZoom / zoom);

      onPanChange({ x: newPanX, y: newPanY });
      onZoomChange(newZoom);
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNative);
    };
  }, [
    zoom,
    panOffset,
    sensitivitySettings,
    isSpacePressed,
    onPanChange,
    onZoomChange,
  ]);

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or space or pan tool -> Pan canvas
    if (e.button === 1 || isSpacePressed || activeTool === 'pan') {
      setIsPanning(true);
      setPanStartMouse({ x: e.clientX, y: e.clientY });
      setPanStartOffset({ x: panOffset.x, y: panOffset.y });
      return;
    }

    if (e.button !== 0) return; // Only left click

    const cPt = screenToCanvas(e.clientX, e.clientY);

    // If drawing polygon
    if (isDrawingPolygon) {
      let ptX = cPt.x;
      let ptY = cPt.y;

      if (gridSettings.snapToGrid) {
        ptX = snapToGrid(ptX, gridSettings.size, scaleSettings.pixelsPerMeter);
        ptY = snapToGrid(ptY, gridSettings.size, scaleSettings.pixelsPerMeter);
      }

      // Check if clicking near first point to close
      if (polygonPoints.length >= 3) {
        const firstPt = polygonPoints[0];
        if (Math.hypot(ptX - firstPt.x, ptY - firstPt.y) < 15 / zoom) {
          onFinishPolygon();
          return;
        }
      }

      onAddPolygonPoint({ x: ptX, y: ptY });
      return;
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const cPt = screenToCanvas(e.clientX, e.clientY);
    setCanvasMouse(cPt);
    onCursorMove(cPt);

    // 1. Laptop Spacebar gliding: tahan space + mousepad geser doang (tanpa harus klik tahan)
    if (isSpacePressed && !isDragging) {
      if (e.movementX !== 0 || e.movementY !== 0) {
        const panSens = sensitivitySettings?.panSensitivity ?? 1.0;
        onPanChange({
          x: panOffset.x + e.movementX * panSens,
          y: panOffset.y + e.movementY * panSens,
        });
      }
      return;
    }

    // 2. Standard Panning canvas with panSensitivity (middle click or drag with pan tool)
    if (isPanning) {
      const panSens = sensitivitySettings?.panSensitivity ?? 1.0;
      const dx = (e.clientX - panStartMouse.x) * panSens;
      const dy = (e.clientY - panStartMouse.y) * panSens;
      onPanChange({
        x: panStartOffset.x + dx,
        y: panStartOffset.y + dy,
      });
      return;
    }

    // Dragging shape / handles
    if (isDragging && selectedShape && initialShapeState && dragHandle) {
      const dx = cPt.x - dragStartMouse.x;
      const dy = cPt.y - dragStartMouse.y;

      let updated = { ...selectedShape };

      // 1. Move whole body
      if (dragHandle === 'body') {
        let newX = initialShapeState.x + dx;
        let newY = initialShapeState.y + dy;

        if (gridSettings.snapToGrid) {
          newX = snapToGrid(newX, gridSettings.size, scaleSettings.pixelsPerMeter);
          newY = snapToGrid(newY, gridSettings.size, scaleSettings.pixelsPerMeter);
        }

        // Smart guides & Wall-Join Alignment
        const useSmartGuides = sensitivitySettings?.showSmartGuides ?? true;
        const useWallJoin = sensitivitySettings?.autoWallJoin ?? true;

        if (useSmartGuides || useWallJoin) {
          const candidateShapes = shapes.filter((s) => s.id !== selectedShape.id && isShapeVisible(s));
          const alignRes = calculateDragAlignment(
            { ...selectedShape, x: newX, y: newY },
            candidateShapes,
            8 / zoom,
            useWallJoin
          );
          newX = alignRes.snappedX;
          newY = alignRes.snappedY;

          if (useSmartGuides) {
            setActiveSmartGuides(alignRes.guides);
          } else {
            setActiveSmartGuides([]);
          }
          setHasWallJoinActive(alignRes.hasWallJoinSnap);
        } else {
          setActiveSmartGuides([]);
          setHasWallJoinActive(false);
        }

        updated.x = newX;
        updated.y = newY;

        // Calculate dynamic real-time distance indicators to nearest colliders while dragging
        const colliderCandidates = shapes.filter((s) => s.id !== selectedShape.id && isShapeVisible(s));
        const distances = calculateColliderDistances(
          { ...selectedShape, x: newX, y: newY },
          colliderCandidates,
          scaleSettings.pixelsPerMeter,
          scaleSettings.unit
        );
        setActiveDistanceIndicators(distances);
      }
      // 2. Rotate handle
      else if (dragHandle === 'rot') {
        const centerX = initialShapeState.x + initialShapeState.width / 2;
        const centerY = initialShapeState.y + initialShapeState.height / 2;
        const rad = Math.atan2(cPt.y - centerY, cPt.x - centerX);
        let deg = (rad * 180) / Math.PI + 90;
        if (deg < 0) deg += 360;

        // Snap angle to 15 degrees if shift held
        if (e.shiftKey) {
          deg = Math.round(deg / 15) * 15;
        }
        updated.rotation = Math.round(deg);
      }
      // 3. Move individual vertex of polygon
      else if (dragHandle === 'vertex' && dragVertexIndex !== null && updated.points) {
        const newPts = [...updated.points];
        let vx = cPt.x - updated.x;
        let vy = cPt.y - updated.y;

        if (gridSettings.snapToGrid) {
          const absVx = snapToGrid(cPt.x, gridSettings.size, scaleSettings.pixelsPerMeter);
          const absVy = snapToGrid(cPt.y, gridSettings.size, scaleSettings.pixelsPerMeter);
          vx = absVx - updated.x;
          vy = absVy - updated.y;
        }

        newPts[dragVertexIndex] = { x: vx, y: vy };
        updated.points = newPts;
      }
      // 4. Resize handles
      else {
        let newW = initialShapeState.width;
        let newH = initialShapeState.height;
        let newX = initialShapeState.x;
        let newY = initialShapeState.y;

        const isLockAspect = selectedShape.lockAspectRatio;
        const originalRatio = initialShapeState.width / (initialShapeState.height || 1);

        if (dragHandle.includes('e')) newW = Math.max(10, initialShapeState.width + dx);
        if (dragHandle.includes('s')) newH = Math.max(10, initialShapeState.height + dy);
        if (dragHandle.includes('w')) {
          const deltaW = Math.min(initialShapeState.width - 10, dx);
          newW = initialShapeState.width - deltaW;
          newX = initialShapeState.x + deltaW;
        }
        if (dragHandle.includes('n')) {
          const deltaH = Math.min(initialShapeState.height - 10, dy);
          newH = initialShapeState.height - deltaH;
          newY = initialShapeState.y + deltaH;
        }

        // Apply aspect ratio lock if active
        if (isLockAspect) {
          if (dragHandle === 'e' || dragHandle === 'w') {
            newH = newW / originalRatio;
          } else if (dragHandle === 'n' || dragHandle === 's') {
            newW = newH * originalRatio;
          } else {
            // Corner handles (se, sw, ne, nw)
            const dominantDim = Math.max(newW, newH * originalRatio);
            newW = dominantDim;
            newH = dominantDim / originalRatio;
          }
        }

        if (gridSettings.snapToGrid) {
          newW = snapToGrid(newW, gridSettings.size, scaleSettings.pixelsPerMeter);
          newH = snapToGrid(newH, gridSettings.size, scaleSettings.pixelsPerMeter);
          newX = snapToGrid(newX, gridSettings.size, scaleSettings.pixelsPerMeter);
          newY = snapToGrid(newY, gridSettings.size, scaleSettings.pixelsPerMeter);
        }

        // Smart guides for resizing
        if (sensitivitySettings?.showSmartGuides) {
          const candidateShapes = shapes.filter((s) => s.id !== selectedShape.id && isShapeVisible(s));
          const resAlign = calculateResizeAlignment(
            newX,
            newY,
            newW,
            newH,
            dragHandle,
            candidateShapes,
            8 / zoom
          );
          newX = resAlign.snappedX;
          newY = resAlign.snappedY;
          newW = resAlign.snappedWidth;
          newH = resAlign.snappedHeight;
          setActiveSmartGuides(resAlign.guides);
        } else {
          setActiveSmartGuides([]);
        }

        updated.width = Math.max(10, newW);
        updated.height = Math.max(10, newH);
        updated.x = newX;
        updated.y = newY;
      }

      onUpdateShape(updated);
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (isDragging && selectedShape && initialShapeState && dragHandle) {
      const hasMoved = initialShapeState.x !== selectedShape.x || initialShapeState.y !== selectedShape.y;
      const hasResized =
        initialShapeState.width !== selectedShape.width || initialShapeState.height !== selectedShape.height;
      const hasRotated = initialShapeState.rotation !== selectedShape.rotation;
      const hasPointsChanged =
        JSON.stringify(initialShapeState.points) !== JSON.stringify(selectedShape.points);

      if (hasMoved || hasResized || hasRotated || hasPointsChanged) {
        let desc = `Ubah ${selectedShape.name}`;
        if (dragHandle === 'body') desc = `Pindahkan ${selectedShape.name}`;
        else if (dragHandle === 'rot') desc = `Putar ${selectedShape.name} (${selectedShape.rotation}°)`;
        else if (dragHandle === 'vertex') desc = `Ubah Sudut ${selectedShape.name}`;
        else desc = `Ubah Ukuran ${selectedShape.name}`;

        if (onCommitShapeUpdate) {
          onCommitShapeUpdate(selectedShape, desc);
        }
      }
    }

    setIsDragging(false);
    setIsPanning(false);
    setDragHandle(null);
    setDragVertexIndex(null);
    setActiveSmartGuides([]);
    setHasWallJoinActive(false);

    // Keep distance indicators visible for 2 seconds after releasing drag
    if (distanceTimerRef.current) clearTimeout(distanceTimerRef.current);
    distanceTimerRef.current = setTimeout(() => {
      setActiveDistanceIndicators([]);
    }, 2000);
  };

  // Handle start dragging a shape or handle
  const handleStartDragHandle = (e: React.MouseEvent, handle: DragHandleType, vertexIdx?: number) => {
    e.stopPropagation();
    if (activeTool === 'pan' || isSpacePressed) return;
    if (isShapeLocked(selectedShape)) return; // Prevent editing locked layers

    const cPt = screenToCanvas(e.clientX, e.clientY);
    setIsDragging(true);
    setDragHandle(handle);
    setDragStartMouse(cPt);
    setInitialShapeState(selectedShape ? { ...selectedShape } : null);
    if (vertexIdx !== undefined) setDragVertexIndex(vertexIdx);
  };

  // Theme styling definitions
  const themeStyles = {
    light: {
      bg: '#fcfcfc',
      gridMajor: '#e2e8f0',
      gridMinor: '#f1f5f9',
      border: '#cbd5e1',
    },
    blueprint: {
      bg: '#0c2340',
      gridMajor: '#1d4ed8',
      gridMinor: '#1e3a8a',
      border: '#3b82f6',
    },
    darkcad: {
      bg: '#111827',
      gridMajor: '#374151',
      gridMinor: '#1f2937',
      border: '#4b5563',
    },
  }[canvasTheme];

  // Grid calculation
  const gridPx = gridSettings.size * scaleSettings.pixelsPerMeter;

  // Detect wall joins for seamless architectural joins between touching walls
  const wallJoins = useMemo(() => {
    if (!sensitivitySettings?.autoWallJoin) return [];
    return detectWallJoins(shapes.filter(isShapeVisible));
  }, [shapes, sensitivitySettings?.autoWallJoin, layers]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => onCursorMove(null)}
      onContextMenu={(e) => {
        e.preventDefault();
        const canvasPt = screenToCanvas(e.clientX, e.clientY);
        onOpenContextMenu?.(e.clientX, e.clientY, canvasPt, null);
      }}
      className={`relative flex-1 h-full overflow-hidden select-none cursor-crosshair ${
        isPanning || isSpacePressed || activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      style={{ backgroundColor: themeStyles.bg }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full block overflow-visible"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Architectural Patterns */}
          {/* 1. Diagonal Wall Hatch */}
          <pattern id="hatch-diagonal" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
          </pattern>

          {/* 2. Ceramic Tile Hatch */}
          <pattern id="hatch-tile" width="25" height="25" patternUnits="userSpaceOnUse">
            <rect width="25" height="25" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          </pattern>

          {/* 3. Wood Parquet Hatch */}
          <pattern id="hatch-wood" width="30" height="15" patternUnits="userSpaceOnUse">
            <rect width="30" height="15" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" opacity="0.6" />
            <line x1="15" y1="0" x2="15" y2="15" stroke="#d97706" strokeWidth="0.8" opacity="0.6" />
          </pattern>

          {/* 4. Fine Grid Hatch */}
          <pattern id="hatch-grid" width="15" height="15" patternUnits="userSpaceOnUse">
            <rect width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="0.75" />
          </pattern>

          {/* Background Canvas Grid Pattern */}
          {gridSettings.enabled && (
            <pattern
              id="cad-grid"
              width={gridPx}
              height={gridPx}
              patternUnits="userSpaceOnUse"
            >
              <rect width={gridPx} height={gridPx} fill="none" stroke={themeStyles.gridMinor} strokeWidth="0.5" />
              <line x1={0} y1={0} x2={gridPx} y2={0} stroke={themeStyles.gridMajor} strokeWidth="1" />
              <line x1={0} y1={0} x2={0} y2={gridPx} stroke={themeStyles.gridMajor} strokeWidth="1" />
            </pattern>
          )}
        </defs>

        {/* Dynamic Architectural Grid (Expanded to 300,000 x 300,000 to effortlessly fit 100m x 100m+ sites) */}
        {gridSettings.enabled && (
          <rect
            x={-150000}
            y={-150000}
            width={300000}
            height={300000}
            fill="url(#cad-grid)"
          />
        )}

        {/* Global World Origin Crosshair (0,0) */}
        <g opacity={0.4}>
          <line x1={-30} y1={0} x2={30} y2={0} stroke="#3b82f6" strokeWidth={1.5} />
          <line x1={0} y1={-30} x2={0} y2={30} stroke="#3b82f6" strokeWidth={1.5} />
          <circle cx={0} cy={0} r={4} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
        </g>

        {/* RENDER SHAPES */}
        {(() => {
          const visibleShapes = shapes.filter(isShapeVisible);
          return shapes
            .filter(isShapeVisible)
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((shape) => {
              const isSelected = shape.id === selectedShapeId;
              const isLocked = isShapeLocked(shape);
              const wM = pxToMeters(shape.width, scaleSettings.pixelsPerMeter);
              const hM = pxToMeters(shape.height, scaleSettings.pixelsPerMeter);
              const areaM2 = calculateShapeAreaM2(shape, scaleSettings.pixelsPerMeter);

              // Smart anti-overlap dynamic positioning for labels & dimensions
              const isAutoAvoidActive =
                (sensitivitySettings?.autoAvoidDimensionLabels ?? true) &&
                shape.autoAvoidLabels !== false;

              const smartCenter = calculateSmartCenterLabelPosition(
                shape,
                visibleShapes,
                isAutoAvoidActive
              );

              const smartDimBadges = calculateSmartDimensionBadges(
                shape,
                visibleShapes,
                isAutoAvoidActive
              );

              const smartDimLine =
                shape.type === 'dimension_line'
                  ? calculateSmartDimensionLineText(shape, visibleShapes, isAutoAvoidActive)
                  : null;

              // Determine fill
              let fill = shape.fillColor;
              if (shape.hatchPattern && shape.hatchPattern !== 'none') {
                fill = `url(#hatch-${shape.hatchPattern})`;
              }

            return (
              <g
                key={shape.id}
                transform={`translate(${shape.x}, ${shape.y}) rotate(${shape.rotation || 0}, ${shape.width / 2}, ${shape.height / 2})`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDrawingPolygon) onSelectShape(shape.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (!isDrawingPolygon) {
                    onSelectShape(shape.id);
                    onOpenInspector?.();
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDrawingPolygon) onSelectShape(shape.id);
                  const canvasPt = screenToCanvas(e.clientX, e.clientY);
                  onOpenContextMenu?.(e.clientX, e.clientY, canvasPt, shape);
                }}
                className="cursor-pointer"
              >
                {/* 1. Rectangle Room / Box */}
                {shape.type === 'rect_room' && (
                  <g>
                    {/* Floor Fill */}
                    <rect
                      width={shape.width}
                      height={shape.height}
                      fill={fill}
                      opacity={shape.opacity}
                    />
                    {/* Double Wall Stroke (Architectural standard: thick wall profile) */}
                    <rect
                      width={shape.width}
                      height={shape.height}
                      fill="none"
                      stroke={shape.strokeColor}
                      strokeWidth={shape.strokeWidth}
                    />
                    <rect
                      x={4}
                      y={4}
                      width={Math.max(0, shape.width - 8)}
                      height={Math.max(0, shape.height - 8)}
                      fill="none"
                      stroke={shape.strokeColor}
                      strokeWidth={0.8}
                      opacity={0.4}
                    />
                  </g>
                )}

                {/* 2. L-Shaped Room */}
                {shape.type === 'l_room' && (
                  <g>
                    {(() => {
                      const w = shape.width;
                      const h = shape.height;
                      const cutW = w * 0.5;
                      const cutH = h * 0.5;
                      const path = `M 0 0 L ${w} 0 L ${w} ${cutH} L ${cutW} ${cutH} L ${cutW} ${h} L 0 ${h} Z`;
                      return (
                        <>
                          <path d={path} fill={fill} opacity={shape.opacity} />
                          <path d={path} fill="none" stroke={shape.strokeColor} strokeWidth={shape.strokeWidth} />
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* 3. T-Shaped Room */}
                {shape.type === 't_room' && (
                  <g>
                    {(() => {
                      const w = shape.width;
                      const h = shape.height;
                      const cutW = w * 0.25;
                      const cutH = h * 0.4;
                      const path = `M 0 0 L ${w} 0 L ${w} ${cutH} L ${w - cutW} ${cutH} L ${w - cutW} ${h} L ${cutW} ${h} L ${cutW} ${cutH} L 0 ${cutH} Z`;
                      return (
                        <>
                          <path d={path} fill={fill} opacity={shape.opacity} />
                          <path d={path} fill="none" stroke={shape.strokeColor} strokeWidth={shape.strokeWidth} />
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* 4. Circular Room / Column Round */}
                {(shape.type === 'circle_room' || shape.type === 'column_round') && (
                  <g>
                    <ellipse
                      cx={shape.width / 2}
                      cy={shape.height / 2}
                      rx={shape.width / 2}
                      ry={shape.height / 2}
                      fill={fill}
                      stroke={shape.strokeColor}
                      strokeWidth={shape.strokeWidth}
                      opacity={shape.opacity}
                    />
                    {shape.type === 'column_round' && (
                      <ellipse
                        cx={shape.width / 2}
                        cy={shape.height / 2}
                        rx={shape.width / 2 - 2}
                        ry={shape.height / 2 - 2}
                        fill="none"
                        stroke="#64748b"
                        strokeWidth={0.8}
                      />
                    )}
                  </g>
                )}

                {/* 5. Custom Polygon / Bikin Shape Sendiri */}
                {shape.type === 'polygon' && shape.points && shape.points.length >= 3 && (
                  <g>
                    {(() => {
                      const ptsStr = shape.points.map((p) => `${p.x},${p.y}`).join(' ');
                      return (
                        <>
                          <polygon
                            points={ptsStr}
                            fill={fill}
                            opacity={shape.opacity}
                            stroke={shape.strokeColor}
                            strokeWidth={shape.strokeWidth}
                          />
                          {/* Inner outline */}
                          <polygon
                            points={ptsStr}
                            fill="none"
                            stroke={shape.strokeColor}
                            strokeWidth={0.8}
                            opacity={0.3}
                            transform="scale(0.96) translate(3,3)"
                          />
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* 6. Single Door (Swing arc standard CAD) */}
                {shape.type === 'door_single' && (
                  <g>
                    {/* Door frame */}
                    <line x1={0} y1={0} x2={shape.width} y2={0} stroke={shape.strokeColor} strokeWidth={1} strokeDasharray="3,3" />
                    {/* Door leaf */}
                    <line x1={0} y1={0} x2={0} y2={shape.width} stroke={shape.strokeColor} strokeWidth={2.5} />
                    {/* Swing arc */}
                    <path
                      d={`M 0 ${shape.width} A ${shape.width} ${shape.width} 0 0 0 ${shape.width} 0`}
                      fill="none"
                      stroke={shape.strokeColor}
                      strokeWidth={1.2}
                      strokeDasharray="4,4"
                    />
                    {/* Hinge point */}
                    <circle cx={0} cy={0} r={3} fill="#dc2626" />
                  </g>
                )}

                {/* 7. Double Door */}
                {shape.type === 'door_double' && (
                  <g>
                    <line x1={0} y1={0} x2={shape.width} y2={0} stroke={shape.strokeColor} strokeWidth={1} strokeDasharray="3,3" />
                    <line x1={0} y1={0} x2={0} y2={shape.width / 2} stroke={shape.strokeColor} strokeWidth={2.5} />
                    <line x1={shape.width} y1={0} x2={shape.width} y2={shape.width / 2} stroke={shape.strokeColor} strokeWidth={2.5} />
                    <path
                      d={`M 0 ${shape.width / 2} A ${shape.width / 2} ${shape.width / 2} 0 0 0 ${shape.width / 2} 0`}
                      fill="none"
                      stroke={shape.strokeColor}
                      strokeWidth={1}
                      strokeDasharray="3,3"
                    />
                    <path
                      d={`M ${shape.width} ${shape.width / 2} A ${shape.width / 2} ${shape.width / 2} 0 0 1 ${shape.width / 2} 0`}
                      fill="none"
                      stroke={shape.strokeColor}
                      strokeWidth={1}
                      strokeDasharray="3,3"
                    />
                  </g>
                )}

                {/* 8. Window Double */}
                {shape.type === 'window_double' && (
                  <g>
                    <rect width={shape.width} height={shape.height} fill={shape.fillColor} stroke={shape.strokeColor} strokeWidth={1.5} />
                    <line x1={0} y1={shape.height / 2} x2={shape.width} y2={shape.height / 2} stroke={shape.strokeColor} strokeWidth={1} />
                    <line x1={shape.width / 2} y1={0} x2={shape.width / 2} y2={shape.height} stroke={shape.strokeColor} strokeWidth={1.5} />
                  </g>
                )}

                {/* 9. Column Rect */}
                {shape.type === 'column_rect' && (
                  <g>
                    <rect width={shape.width} height={shape.height} fill={shape.fillColor} stroke={shape.strokeColor} strokeWidth={1.5} />
                    {/* Cross hatch inside column */}
                    <line x1={0} y1={0} x2={shape.width} y2={shape.height} stroke="#64748b" strokeWidth={1} />
                    <line x1={shape.width} y1={0} x2={0} y2={shape.height} stroke="#64748b" strokeWidth={1} />
                  </g>
                )}

                {/* 10. Wall Line */}
                {shape.type === 'wall_line' && (
                  <g>
                    <rect width={shape.width} height={shape.height} fill={shape.fillColor} stroke={shape.strokeColor} strokeWidth={shape.strokeWidth} />
                    <line x1={0} y1={shape.height / 2} x2={shape.width} y2={shape.height / 2} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4,2" />
                  </g>
                )}

                {/* 11. Furniture: Bed Double */}
                {shape.type === 'bed_double' && (
                  <g>
                    <rect width={shape.width} height={shape.height} rx={4} fill={shape.fillColor} stroke={shape.strokeColor} strokeWidth={1.5} />
                    {/* Pillows */}
                    <rect x={shape.width * 0.1} y={shape.height * 0.08} width={shape.width * 0.35} height={shape.height * 0.22} rx={2} fill="#ffffff" stroke="#94a3b8" strokeWidth={1} />
                    <rect x={shape.width * 0.55} y={shape.height * 0.08} width={shape.width * 0.35} height={shape.height * 0.22} rx={2} fill="#ffffff" stroke="#94a3b8" strokeWidth={1} />
                    {/* Blanket line */}
                    <line x1={0} y1={shape.height * 0.4} x2={shape.width} y2={shape.height * 0.4} stroke="#cbd5e1" strokeWidth={1.5} />
                  </g>
                )}

                {/* 12. Furniture: Sofa */}
                {shape.type === 'sofa_3seat' && (
                  <g>
                    <rect width={shape.width} height={shape.height} rx={6} fill={shape.fillColor} stroke={shape.strokeColor} strokeWidth={1.5} />
                    {/* Armrests */}
                    <rect x={0} y={0} width={shape.width * 0.12} height={shape.height} rx={3} fill="#94a3b8" opacity={0.3} />
                    <rect x={shape.width * 0.88} y={0} width={shape.width * 0.12} height={shape.height} rx={3} fill="#94a3b8" opacity={0.3} />
                    {/* Backrest */}
                    <rect x={0} y={0} width={shape.width} height={shape.height * 0.3} rx={3} fill="#94a3b8" opacity={0.4} />
                  </g>
                )}

                {/* 13. Furniture: Dining Table */}
                {shape.type === 'dining_table' && (
                  <g>
                    <rect width={shape.width} height={shape.height} rx={4} fill={shape.fillColor} stroke={shape.strokeColor} strokeWidth={1.5} />
                    {/* Chairs */}
                    <rect x={shape.width * 0.15} y={-8} width={shape.width * 0.2} height={6} rx={1} fill="#94a3b8" />
                    <rect x={shape.width * 0.65} y={-8} width={shape.width * 0.2} height={6} rx={1} fill="#94a3b8" />
                    <rect x={shape.width * 0.15} y={shape.height + 2} width={shape.width * 0.2} height={6} rx={1} fill="#94a3b8" />
                    <rect x={shape.width * 0.65} y={shape.height + 2} width={shape.width * 0.2} height={6} rx={1} fill="#94a3b8" />
                  </g>
                )}

                {/* 14. Kitchen Counter */}
                {shape.type === 'kitchen_counter' && (
                  <g>
                    <rect width={shape.width} height={shape.height} fill={shape.fillColor} stroke={shape.strokeColor} strokeWidth={1.5} />
                    {/* Sink */}
                    <rect x={shape.width * 0.15} y={shape.height * 0.15} width={shape.width * 0.3} height={shape.height * 0.7} rx={3} fill="#ffffff" stroke="#0284c7" strokeWidth={1} />
                    <circle cx={shape.width * 0.3} cy={shape.height * 0.5} r={3} fill="#0284c7" />
                  </g>
                )}

                {/* 15. Dimension Line */}
                {shape.type === 'dimension_line' && (
                  <g>
                    {/* Main line */}
                    <line x1={0} y1={shape.height / 2} x2={shape.width} y2={shape.height / 2} stroke={shape.strokeColor} strokeWidth={shape.strokeWidth} />
                    {/* CAD Arrows / Ticks */}
                    <line x1={0} y1={0} x2={0} y2={shape.height} stroke={shape.strokeColor} strokeWidth={1.5} />
                    <line x1={shape.width} y1={0} x2={shape.width} y2={shape.height} stroke={shape.strokeColor} strokeWidth={1.5} />
                    {/* 45 degree ticks */}
                    <line x1={-4} y1={shape.height / 2 + 4} x2={4} y2={shape.height / 2 - 4} stroke={shape.strokeColor} strokeWidth={2} />
                    <line x1={shape.width - 4} y1={shape.height / 2 + 4} x2={shape.width + 4} y2={shape.height / 2 - 4} stroke={shape.strokeColor} strokeWidth={2} />
                    {/* Dimension Value Text (Smart dynamic collision avoidance) */}
                    <g transform={`translate(${smartDimLine ? smartDimLine.x : shape.width / 2}, ${smartDimLine ? smartDimLine.y : shape.height / 2 - 4})`}>
                      <rect
                        x={-24}
                        y={-8}
                        width={48}
                        height={16}
                        rx={3}
                        fill={canvasTheme === 'blueprint' ? '#0c2340' : '#ffffff'}
                        fillOpacity={0.9}
                        stroke={smartDimLine?.isFlipped ? '#38bdf8' : (canvasTheme === 'blueprint' ? '#3b82f6' : '#cbd5e1')}
                        strokeWidth={0.6}
                      />
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fill={canvasTheme === 'blueprint' ? '#38bdf8' : shape.strokeColor}
                        fontSize={10.5}
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {wM.toFixed(2)} m
                      </text>
                    </g>
                  </g>
                )}

                {/* 16. Text Note */}
                {shape.type === 'text_note' && (
                  <g>
                    <text
                      x={shape.width / 2}
                      y={shape.height / 2 + 4}
                      textAnchor="middle"
                      fill="#eab308"
                      fontSize={shape.fontSize || 12}
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {shape.textContent || shape.name}
                    </text>
                  </g>
                )}

                {/* 17. Custom Precision Box Shape */}
                {shape.type === 'custom' && (
                  <g>
                    <rect
                      width={shape.width}
                      height={shape.height}
                      fill={fill}
                      opacity={shape.opacity}
                      stroke={shape.strokeColor}
                      strokeWidth={shape.strokeWidth}
                    />
                  </g>
                )}

                {/* Room / Custom Shape Name & Automatic Area Label (Smart Dynamic Collision Avoidance) */}
                {(shape.category === 'room' || shape.type === 'custom' || (shape.type === 'polygon' && shape.name)) && (
                  <g pointerEvents="none">
                    {/* Architectural Leader line to room center if displaced due to obstacles */}
                    {smartCenter.leaderLine && (
                      <g opacity={0.75}>
                        <line
                          x1={smartCenter.leaderLine.x1}
                          y1={smartCenter.leaderLine.y1}
                          x2={smartCenter.leaderLine.x2}
                          y2={smartCenter.leaderLine.y2}
                          stroke={canvasTheme === 'blueprint' ? '#38bdf8' : '#64748b'}
                          strokeWidth={1.2}
                          strokeDasharray="3,3"
                        />
                        <circle
                          cx={smartCenter.leaderLine.x1}
                          cy={smartCenter.leaderLine.y1}
                          r={2.5}
                          fill={canvasTheme === 'blueprint' ? '#38bdf8' : '#64748b'}
                        />
                      </g>
                    )}
                    <rect
                      x={smartCenter.x - 60}
                      y={smartCenter.y - 18}
                      width={120}
                      height={36}
                      rx={4}
                      fill={canvasTheme === 'blueprint' ? '#0c2340' : '#ffffff'}
                      fillOpacity={0.92}
                      stroke={smartCenter.isDisplaced ? '#38bdf8' : (canvasTheme === 'blueprint' ? '#3b82f6' : '#cbd5e1')}
                      strokeWidth={smartCenter.isDisplaced ? 1.2 : 0.5}
                    />
                    <text
                      x={smartCenter.x}
                      y={smartCenter.y - 3}
                      textAnchor="middle"
                      fill={canvasTheme === 'blueprint' ? '#ffffff' : '#0f172a'}
                      fontSize={10.5}
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {shape.name}
                    </text>
                    <text
                      x={smartCenter.x}
                      y={smartCenter.y + 11}
                      textAnchor="middle"
                      fill={canvasTheme === 'blueprint' ? '#93c5fd' : '#475569'}
                      fontSize={9.5}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {wM.toFixed(2)} × {hM.toFixed(2)}m ({formatArea(areaM2, scaleSettings.unit)})
                    </text>
                  </g>
                )}

                {/* Outer Dimension Badges on shape with dynamic flip/shift to prevent wall & shape overlap */}
                {shape.showDimensionLabels && shape.category === 'room' && (
                  <g pointerEvents="none" opacity={0.9}>
                    {/* Width dimension */}
                    <g transform={`translate(${smartDimBadges.widthBadge.x}, ${smartDimBadges.widthBadge.y})`}>
                      <rect
                        x={-24}
                        y={-8}
                        width={48}
                        height={16}
                        rx={3}
                        fill="#0f172a"
                        fillOpacity={0.88}
                        stroke={smartDimBadges.widthBadge.isFlipped ? '#38bdf8' : '#334155'}
                        strokeWidth={smartDimBadges.widthBadge.isFlipped ? 1.2 : 0.6}
                      />
                      <text x={0} y={4} textAnchor="middle" fill="#38bdf8" fontSize={9.5} fontWeight="bold" fontFamily="monospace">
                        {wM.toFixed(2)}m
                      </text>
                    </g>
                    {/* Height dimension */}
                    <g transform={`translate(${smartDimBadges.heightBadge.x}, ${smartDimBadges.heightBadge.y})`}>
                      <rect
                        x={-24}
                        y={-8}
                        width={48}
                        height={16}
                        rx={3}
                        fill="#0f172a"
                        fillOpacity={0.88}
                        stroke={smartDimBadges.heightBadge.isFlipped ? '#38bdf8' : '#334155'}
                        strokeWidth={smartDimBadges.heightBadge.isFlipped ? 1.2 : 0.6}
                      />
                      <text x={0} y={4} textAnchor="middle" fill="#38bdf8" fontSize={9.5} fontWeight="bold" fontFamily="monospace">
                        {hM.toFixed(2)}m
                      </text>
                    </g>
                  </g>
                )}

                {/* SELECTION BOUNDING BOX & INTERACTIVE HANDLES */}
                {isSelected && (
                  <g>
                    {/* Bounding box outline */}
                    <rect
                      x={-2}
                      y={-2}
                      width={shape.width + 4}
                      height={shape.height + 4}
                      fill="none"
                      stroke={isLocked ? '#f59e0b' : '#2563eb'}
                      strokeWidth={1.5}
                      strokeDasharray="4,3"
                    />

                    {isLocked ? (
                      /* Lock Badge */
                      <g transform={`translate(${shape.width / 2 - 24}, -24)`} pointerEvents="none">
                        <rect x={0} y={0} width={48} height={18} rx={4} fill="#78350f" stroke="#f59e0b" strokeWidth={1} />
                        <text x={24} y={12} fill="#fde68a" fontSize={9} fontWeight="bold" textAnchor="middle">
                          TERKUNCI
                        </text>
                      </g>
                    ) : (
                      <>
                        {/* Rotation lever */}
                        <line x1={shape.width / 2} y1={-2} x2={shape.width / 2} y2={-24} stroke="#2563eb" strokeWidth={1.5} />
                        <circle
                          cx={shape.width / 2}
                          cy={-24}
                          r={5}
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                          className="cursor-alias hover:scale-125 transition-transform"
                          onMouseDown={(e) => handleStartDragHandle(e, 'rot')}
                        />

                        {/* 8 Resize Handles */}
                        {[
                          { handle: 'nw', x: -4, y: -4, cursor: 'nwse-resize' },
                          { handle: 'n', x: shape.width / 2, y: -4, cursor: 'ns-resize' },
                          { handle: 'ne', x: shape.width + 4, y: -4, cursor: 'nesw-resize' },
                          { handle: 'e', x: shape.width + 4, y: shape.height / 2, cursor: 'ew-resize' },
                          { handle: 'se', x: shape.width + 4, y: shape.height + 4, cursor: 'nwse-resize' },
                          { handle: 's', x: shape.width / 2, y: shape.height + 4, cursor: 'ns-resize' },
                          { handle: 'sw', x: -4, y: shape.height + 4, cursor: 'nesw-resize' },
                          { handle: 'w', x: -4, y: shape.height / 2, cursor: 'ew-resize' },
                        ].map((h) => (
                          <rect
                            key={h.handle}
                            x={h.x - 4}
                            y={h.y - 4}
                            width={8}
                            height={8}
                            fill="#ffffff"
                            stroke="#2563eb"
                            strokeWidth={1.5}
                            style={{ cursor: h.cursor }}
                            onMouseDown={(e) => handleStartDragHandle(e, h.handle as DragHandleType)}
                          />
                        ))}

                        {/* Draggable Polygon Vertices (if polygon shape) */}
                        {shape.type === 'polygon' &&
                          shape.points &&
                          shape.points.map((pt, idx) => (
                            <circle
                              key={`vertex-${idx}`}
                              cx={pt.x}
                              cy={pt.y}
                              r={5}
                              fill="#ec4899"
                              stroke="#ffffff"
                              strokeWidth={1.5}
                              className="cursor-move hover:scale-125 transition-transform"
                              onMouseDown={(e) => handleStartDragHandle(e, 'vertex', idx)}
                            />
                          ))}
                      </>
                    )}
                  </g>
                )}

                {/* Invisible body drag catcher */}
                <rect
                  width={shape.width}
                  height={shape.height}
                  fill="transparent"
                  onMouseDown={(e) => handleStartDragHandle(e, 'body')}
                />
              </g>
            );
          });
        })()}

        {/* AUTOMATIC WALL-JOIN ARCHITECTURAL PATCHES (Seams blended for clean monolithic walls) */}
        {sensitivitySettings?.autoWallJoin && wallJoins.length > 0 && (
          <g pointerEvents="none">
            {wallJoins.map((join) => (
              <g key={join.id}>
                {/* Seamless core filler removes dividing internal lines between touching walls */}
                <rect
                  x={join.x}
                  y={join.y}
                  width={join.width}
                  height={join.height}
                  fill={join.fillColor}
                  opacity={1}
                />
              </g>
            ))}
          </g>
        )}

        {/* SMART GUIDES (DYNAMIC DASHED CAD ALIGNMENT LINES) */}
        {activeSmartGuides.length > 0 && (
          <g pointerEvents="none">
            {activeSmartGuides.map((guide) => {
              const isWallAbut = guide.snapKind === 'wall_abut';
              const strokeCol = isWallAbut ? '#10b981' : '#0284c7';

              return (
                <g key={guide.id}>
                  {guide.type === 'vertical' ? (
                    <line
                      x1={guide.position}
                      y1={guide.start}
                      x2={guide.position}
                      y2={guide.end}
                      stroke={strokeCol}
                      strokeWidth={1.5}
                      strokeDasharray="5,4"
                    />
                  ) : (
                    <line
                      x1={guide.start}
                      y1={guide.position}
                      x2={guide.end}
                      y2={guide.position}
                      stroke={strokeCol}
                      strokeWidth={1.5}
                      strokeDasharray="5,4"
                    />
                  )}

                  {/* Guide Alignment Label Pill */}
                  {guide.label && (
                    <g
                      transform={`translate(${
                        guide.type === 'vertical'
                          ? guide.position + 12
                          : (guide.start + guide.end) / 2
                      }, ${
                        guide.type === 'vertical'
                          ? (guide.start + guide.end) / 2
                          : guide.position - 12
                      })`}
                    >
                      <rect
                        x={-46}
                        y={-9}
                        width={92}
                        height={18}
                        rx={4}
                        fill={isWallAbut ? '#064e3b' : '#0c4a6e'}
                        fillOpacity={0.94}
                        stroke={isWallAbut ? '#34d399' : '#38bdf8'}
                        strokeWidth={0.8}
                      />
                      <text
                        x={0}
                        y={3.5}
                        textAnchor="middle"
                        fill={isWallAbut ? '#a7f3d0' : '#e0f2fe'}
                        fontSize={9}
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {guide.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* Active Wall Join Live Snapping Badge */}
        {hasWallJoinActive && selectedShape && (
          <g
            transform={`translate(${selectedShape.x + selectedShape.width / 2}, ${selectedShape.y - 20})`}
            pointerEvents="none"
          >
            <rect
              x={-58}
              y={-10}
              width={116}
              height={20}
              rx={5}
              fill="#064e3b"
              stroke="#34d399"
              strokeWidth={1}
            />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fill="#ecfdf5"
              fontSize={9.5}
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              ✓ Sambung Dinding
            </text>
          </g>
        )}

        {/* Dynamic Distance Indicators to Nearest Colliders */}
        {activeDistanceIndicators.length > 0 && (
          <g className="collider-distance-indicators" pointerEvents="none">
            {activeDistanceIndicators.map((dist) => {
              const isX = dist.axis === 'x';
              const midX = (dist.x1 + dist.x2) / 2;
              const midY = (dist.y1 + dist.y2) / 2;

              // Compensate scale inversely with zoom so the badge remains compact and crisp at any zoom level
              // Clamped to sensible bounds so it doesn't get microscopic or gigantic
              const invScale = Math.max(0.35, Math.min(1.8, 1 / zoom));
              const tickSize = 3.5 * invScale;

              return (
                <g key={dist.id} className="animate-in fade-in duration-100">
                  {/* Slim, elegant dimension line */}
                  <line
                    x1={dist.x1}
                    y1={dist.y1}
                    x2={dist.x2}
                    y2={dist.y2}
                    stroke="#f59e0b"
                    strokeOpacity={0.7}
                    strokeWidth={Math.max(0.8, 1.1 * invScale)}
                    strokeDasharray={dist.isEnclosingWall ? `${4 * invScale},${3 * invScale}` : undefined}
                  />

                  {/* Compact Start tick */}
                  {isX ? (
                    <line
                      x1={dist.x1}
                      y1={dist.y1 - tickSize}
                      x2={dist.x1}
                      y2={dist.y1 + tickSize}
                      stroke="#f59e0b"
                      strokeOpacity={0.75}
                      strokeWidth={Math.max(0.9, 1.3 * invScale)}
                    />
                  ) : (
                    <line
                      x1={dist.x1 - tickSize}
                      y1={dist.y1}
                      x2={dist.x1 + tickSize}
                      y2={dist.y1}
                      stroke="#f59e0b"
                      strokeOpacity={0.75}
                      strokeWidth={Math.max(0.9, 1.3 * invScale)}
                    />
                  )}

                  {/* Compact End tick */}
                  {isX ? (
                    <line
                      x1={dist.x2}
                      y1={dist.y2 - tickSize}
                      x2={dist.x2}
                      y2={dist.y2 + tickSize}
                      stroke="#f59e0b"
                      strokeOpacity={0.75}
                      strokeWidth={Math.max(0.9, 1.3 * invScale)}
                    />
                  ) : (
                    <line
                      x1={dist.x2 - tickSize}
                      y1={dist.y2}
                      x2={dist.x2 + tickSize}
                      y2={dist.y2}
                      stroke="#f59e0b"
                      strokeOpacity={0.75}
                      strokeWidth={Math.max(0.9, 1.3 * invScale)}
                    />
                  )}

                  {/* Compact, Semi-Transparent Distance Measurement Badge (Item behind it stays clearly visible) */}
                  <g transform={`translate(${midX}, ${midY}) scale(${invScale})`}>
                    <rect
                      x={-24}
                      y={-8}
                      width={48}
                      height={16}
                      rx={3.5}
                      fill="#020617"
                      fillOpacity={0.65}
                      stroke="#f59e0b"
                      strokeOpacity={0.75}
                      strokeWidth={0.8}
                    />
                    <text
                      x={0}
                      y={3.5}
                      textAnchor="middle"
                      fill="#fef08a"
                      fontSize={8.5}
                      fontWeight="bold"
                      fontFamily="monospace"
                      letterSpacing="0.02em"
                    >
                      {dist.distanceFormatted}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        )}

        {/* FREEFORM POLYGON DRAWING PREVIEW */}
        {isDrawingPolygon && (
          <g>
            {/* Placed points and line segments */}
            {polygonPoints.length > 0 && (
              <>
                <polyline
                  points={polygonPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                {/* Rubberband line to mouse */}
                <line
                  x1={polygonPoints[polygonPoints.length - 1].x}
                  y1={polygonPoints[polygonPoints.length - 1].y}
                  x2={canvasMouse.x}
                  y2={canvasMouse.y}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4,4"
                />

                {/* Distance & Angle Tooltip */}
                {(() => {
                  const lastPt = polygonPoints[polygonPoints.length - 1];
                  const distPx = distanceBetween(lastPt, canvasMouse);
                  const distM = pxToMeters(distPx, scaleSettings.pixelsPerMeter);
                  const midX = (lastPt.x + canvasMouse.x) / 2;
                  const midY = (lastPt.y + canvasMouse.y) / 2;

                  return (
                    <g transform={`translate(${midX}, ${midY - 12})`} pointerEvents="none">
                      <rect x={-30} y={-8} width={60} height={16} rx={3} fill="#0f172a" fillOpacity={0.9} />
                      <text x={0} y={4} textAnchor="middle" fill="#38bdf8" fontSize={10} fontWeight="bold" fontFamily="monospace">
                        {distM.toFixed(2)} m
                      </text>
                    </g>
                  );
                })()}

                {/* Vertices circles */}
                {polygonPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={i === 0 ? 6 : 4}
                    fill={i === 0 ? '#ef4444' : '#3b82f6'}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                ))}
              </>
            )}

            {/* Crosshair cursor indicator */}
            <circle cx={canvasMouse.x} cy={canvasMouse.y} r={4} fill="#ef4444" />
          </g>
        )}
      </svg>

      {/* Floating Instructions when drawing polygon */}
      {isDrawingPolygon && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-blue-500/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-xs shadow-xl flex items-center gap-3 animate-in fade-in">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span>
            Klik pada kanvas untuk menambah titik sudut ({polygonPoints.length} titik).{' '}
            <strong className="text-blue-400">Klik titik merah pertama</strong> atau tekan{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Enter</kbd> untuk selesai.
          </span>
          {polygonPoints.length >= 3 && (
            <button
              onClick={onFinishPolygon}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white transition-colors"
            >
              Selesai Poligon
            </button>
          )}
          <button
            onClick={onCancelPolygon}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      {/* On-Canvas Initial Base Room Input Card (Centered right in empty canvas) */}
      {shapes.length === 0 && !isDrawingPolygon && onCreateBaseRoom && (
        <InitialRoomCard
          scaleSettings={scaleSettings}
          onCreateBaseRoom={onCreateBaseRoom}
          onOpenTemplates={onOpenTemplates}
          onStartDrawingPolygon={onStartDrawingPolygon}
          onDismiss={onQuickAddRoom}
        />
      )}

      {/* Floating Bottom-Right Zoom & Mouse Sensitivity Controls Widget */}
      <ZoomControlWidget
        zoom={zoom}
        onZoomChange={onZoomChange}
        onResetZoom={() => onZoomChange(1.0)}
        onFitView={onFitView}
        sensitivitySettings={sensitivitySettings}
        onUpdateSensitivity={onUpdateSensitivity}
      />
    </div>
  );
};
