import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CADShape,
  GridSettings,
  LayerItem,
  Point,
  ProjectMetadata,
  ScaleSettings,
  ShapeCategory,
  FloorPlanTemplate,
  MouseSensitivitySettings,
} from './types/cad';
import { unitToPx } from './utils/units';
import { CanvasTheme, Toolbar } from './components/Toolbar';
import { ShapeLibrary } from './components/ShapeLibrary';
import { Inspector } from './components/Inspector';
import { Canvas } from './components/Canvas';
import { DimensionsBar } from './components/DimensionsBar';
import { ScaleModal } from './components/ScaleModal';
import { ExportModal } from './components/ExportModal';
import { LayerManager } from './components/LayerManager';
import { TemplateModal } from './components/TemplateModal';
import { GuideModal } from './components/GuideModal';
import { ContextMenu, ContextMenuTarget } from './components/ContextMenu';
import { PrecisionShapeModal } from './components/PrecisionShapeModal';
import { QuickEditShapeModal } from './components/QuickEditShapeModal';
import { CheckCircle2, RotateCcw, RotateCw, Sliders, PanelLeftOpen, Square } from 'lucide-react';

export const INITIAL_LAYERS: LayerItem[] = [
  { id: 'layer-walls', name: 'Dinding & Struktur', cadLayerName: 'WALLS', color: '#0f172a', visible: true, locked: false },
  { id: 'layer-openings', name: 'Pintu & Kusen', cadLayerName: 'DOORS', color: '#dc2626', visible: true, locked: false },
  { id: 'layer-windows', name: 'Jendela Kaca', cadLayerName: 'WINDOWS', color: '#0284c7', visible: true, locked: false },
  { id: 'layer-furniture', name: 'Perabot & Sanitair', cadLayerName: 'FURNITURE', color: '#64748b', visible: true, locked: false },
  { id: 'layer-dimensions', name: 'Garis Ukur Dimensi', cadLayerName: 'DIMENSIONS', color: '#16a34a', visible: true, locked: false },
  { id: 'layer-text', name: 'Anotasi & Teks', cadLayerName: 'TEXT', color: '#eab308', visible: true, locked: false },
  { id: 'layer-custom', name: 'Shape Kustom', cadLayerName: 'CUSTOM', color: '#9333ea', visible: true, locked: false },
];

interface HistorySnapshot {
  shapes: CADShape[];
  layers: LayerItem[];
  description: string;
  timestamp: number;
}

export default function App() {
  // Scale & Units state
  const [scaleSettings, setScaleSettings] = useState<ScaleSettings>({
    pixelsPerMeter: 50,
    unit: 'm',
    ratioLabel: '1:50',
  });

  // Grid settings
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    enabled: true,
    size: 0.5,
    snapToGrid: true,
    snapToShapes: true,
    subdivisions: 2,
  });

  // Project Title & Architectural Metadata (Clean default start)
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata>({
    title: 'Desain Denah Baru',
    projectName: 'Proyek Arsitektur Bersih',
    architect: 'Desainer ArchiPlan',
    client: 'Klien Pemilik',
    date: new Date().toLocaleDateString('id-ID'),
    revision: 'Rev. 0',
    notes: 'Denah tata ruang arsitektur presisi.',
  });

  // Active Tool & Theme
  const [activeTool, setActiveTool] = useState<'select' | 'polygon' | 'pan'>('select');
  const [canvasTheme, setCanvasTheme] = useState<CanvasTheme>('light');
  const [activeCategory, setActiveCategory] = useState<ShapeCategory | 'templates'>('room');

  // Canvas Viewport (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<Point>({ x: 80, y: 40 });
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  // Mouse Sensitivity & Navigation Settings
  const [mouseSensitivity, setMouseSensitivity] = useState<MouseSensitivitySettings>({
    panSensitivity: 1.0,
    zoomSensitivity: 1.0,
    invertWheelZoom: false,
    autoWallJoin: true,
    showSmartGuides: true,
    autoAvoidDimensionLabels: true,
  });

  // Layers State
  const [layers, setLayers] = useState<LayerItem[]>(INITIAL_LAYERS);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(false);

  // Left Sidebar Visibility (Can be hidden / slid out)
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(true);

  // Detail Inspector Panel Visibility (Default collapsed for clean view & low-spec friendliness)
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Right-click Context Menu State
  const [contextMenuTarget, setContextMenuTarget] = useState<ContextMenuTarget | null>(null);

  // Precision Shape Creation Modal
  const [isPrecisionModalOpen, setIsPrecisionModalOpen] = useState<boolean>(false);
  const [precisionSpawnPoint, setPrecisionSpawnPoint] = useState<Point | null>(null);

  // Quick Edit Shape Modal (triggered by right click -> edit)
  const [quickEditShape, setQuickEditShape] = useState<CADShape | null>(null);

  // Shapes list (ALWAYS start with empty canvas per user request)
  const [shapes, setShapes] = useState<CADShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Advanced History Stack (Snapshots with descriptive action names)
  const [history, setHistory] = useState<HistorySnapshot[]>([
    {
      shapes: [],
      layers: INITIAL_LAYERS,
      description: 'Kanvas Baru Kosong',
      timestamp: Date.now(),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Action toast notification
  const [actionToast, setActionToast] = useState<{ message: string; type: 'undo' | 'redo' | 'action' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'undo' | 'redo' | 'action' = 'action') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setActionToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setActionToast(null);
    }, 2400);
  };

  // Push new state to history
  const pushHistory = useCallback(
    (newShapes: CADShape[], newLayers: LayerItem[] = layers, description: string = 'Ubah Desain') => {
      setShapes(newShapes);
      setLayers(newLayers);

      const snapshot: HistorySnapshot = {
        shapes: newShapes,
        layers: newLayers,
        description,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const next = [...sliced, snapshot];
        if (next.length > 50) next.shift();
        return next;
      });

      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex, layers]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      const targetSnapshot = history[targetIdx];
      const undoneAction = history[historyIndex].description;

      setHistoryIndex(targetIdx);
      setShapes(targetSnapshot.shapes);
      if (targetSnapshot.layers) setLayers(targetSnapshot.layers);

      showToast(`Undo: ${undoneAction}`, 'undo');
    }
  }, [historyIndex, history]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIdx = historyIndex + 1;
      const targetSnapshot = history[targetIdx];

      setHistoryIndex(targetIdx);
      setShapes(targetSnapshot.shapes);
      if (targetSnapshot.layers) setLayers(targetSnapshot.layers);

      showToast(`Redo: ${targetSnapshot.description}`, 'redo');
    }
  }, [historyIndex, history]);

  // Jump to specific history step
  const handleJumpToHistory = (index: number) => {
    if (index >= 0 && index < history.length) {
      const target = history[index];
      setHistoryIndex(index);
      setShapes(target.shapes);
      if (target.layers) setLayers(target.layers);
      showToast(`Kembali ke: ${target.description}`, 'action');
    }
  };

  // Shape manipulations
  const handleAddShape = (newShape: CADShape) => {
    let assignedLayerId = 'layer-walls';
    if (newShape.category === 'opening') {
      assignedLayerId = newShape.type.includes('door') ? 'layer-openings' : 'layer-windows';
    } else if (newShape.category === 'furniture') {
      assignedLayerId = 'layer-furniture';
    } else if (newShape.category === 'dimension') {
      assignedLayerId = 'layer-dimensions';
    } else if (newShape.category === 'text') {
      assignedLayerId = 'layer-text';
    } else if (newShape.category === 'custom') {
      assignedLayerId = 'layer-custom';
    }

    const assigned = {
      ...newShape,
      layerId: newShape.layerId || assignedLayerId,
    };

    const updated = [...shapes, assigned];
    pushHistory(updated, layers, `Tambah ${assigned.name}`);
    setSelectedShapeId(assigned.id);
  };

  // Quick add sample room from empty canvas
  const handleQuickAddRoom = () => {
    const newRoom: CADShape = {
      id: `room-${Date.now()}`,
      name: 'Ruang Tamu Utama',
      type: 'rect_room',
      category: 'room',
      layer: 'WALLS',
      layerId: 'layer-walls',
      x: 180,
      y: 120,
      width: 4 * scaleSettings.pixelsPerMeter,
      height: 5 * scaleSettings.pixelsPerMeter,
      rotation: 0,
      lockAspectRatio: false,
      fillColor: '#ffffff',
      strokeColor: '#0f172a',
      strokeWidth: 3,
      opacity: 1,
      hatchPattern: 'none',
      showDimensionLabels: true,
      zIndex: 1,
    };
    handleAddShape(newRoom);
  };

  // Create Base Room from centered initial card
  const handleCreateBaseRoom = (params: {
    name: string;
    widthUnit: number;
    heightUnit: number;
    roomShape: 'rect_room' | 'l_room';
    wallThicknessUnit: number;
  }) => {
    const widthPx = unitToPx(params.widthUnit, scaleSettings.unit, scaleSettings.pixelsPerMeter);
    const heightPx = unitToPx(params.heightUnit, scaleSettings.unit, scaleSettings.pixelsPerMeter);

    const newRoom: CADShape = {
      id: `room-${Date.now()}`,
      name: params.name,
      type: params.roomShape,
      category: 'room',
      layer: 'WALLS',
      layerId: 'layer-walls',
      x: 180,
      y: 120,
      width: Math.round(widthPx),
      height: Math.round(heightPx),
      rotation: 0,
      lockAspectRatio: false,
      fillColor: '#ffffff',
      strokeColor: '#0f172a',
      strokeWidth: 3,
      opacity: 1,
      hatchPattern: 'none',
      showDimensionLabels: true,
      wallThickness: params.wallThicknessUnit,
      zIndex: 1,
    };

    handleAddShape(newRoom);
    setSelectedShapeId(newRoom.id);
    showToast(`Ruangan dasar ${newRoom.name} (${params.widthUnit}×${params.heightUnit} ${scaleSettings.unit}) dibuat`, 'action');
  };

  // Fit View / Center all shapes in viewport
  const handleFitView = () => {
    if (shapes.length === 0) {
      setZoom(1.0);
      setPanOffset({ x: 80, y: 40 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach((s) => {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    });
    const width = maxX - minX;
    const height = maxY - minY;
    const windowW = window.innerWidth - (isLibraryOpen ? 280 : 0) - (isInspectorOpen ? 320 : 0);
    const windowH = window.innerHeight - 120;

    // Allow zooming out down to 0.04 (4%) so massive spaces (100m x 100m = 10,000px) fit cleanly
    const scale = Math.min(3.0, Math.max(0.04, Math.min((windowW - 100) / (width || 1), (windowH - 100) / (height || 1))));
    setZoom(Number(scale.toFixed(3)));
    setPanOffset({
      x: Math.round((windowW - width * scale) / 2 - minX * scale + (isLibraryOpen ? 50 : 0)),
      y: Math.round((windowH - height * scale) / 2 - minY * scale),
    });
  };

  // Immediate frame update during dragging/typing
  const handleUpdateShapeLive = (updatedShape: CADShape) => {
    const updated = shapes.map((s) => (s.id === updatedShape.id ? updatedShape : s));
    setShapes(updated);
  };

  // Committed update (creates history entry)
  const handleCommitShapeUpdate = (updatedShape: CADShape, actionDesc?: string) => {
    const updated = shapes.map((s) => (s.id === updatedShape.id ? updatedShape : s));
    pushHistory(updated, layers, actionDesc || `Ubah ${updatedShape.name}`);
  };

  const handleDeleteShape = (id: string) => {
    const target = shapes.find((s) => s.id === id);
    const updated = shapes.filter((s) => s.id !== id);
    pushHistory(updated, layers, `Hapus ${target ? target.name : 'Elemen'}`);
    if (selectedShapeId === id) setSelectedShapeId(null);
  };

  const handleDuplicateShape = (id: string, offsetXm: number = 0.5, offsetYm: number = 0.5) => {
    const target = shapes.find((s) => s.id === id);
    if (!target) return;

    const offsetXPx = offsetXm * scaleSettings.pixelsPerMeter;
    const offsetYPx = offsetYm * scaleSettings.pixelsPerMeter;

    const dup: CADShape = {
      ...target,
      id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} (Salin)`,
      x: target.x + offsetXPx,
      y: target.y + offsetYPx,
      zIndex: (target.zIndex || 0) + 1,
    };

    const updated = [...shapes, dup];
    pushHistory(updated, layers, `Duplikasi ${target.name}`);
    setSelectedShapeId(dup.id);
  };

  const handleBringForward = (id: string) => {
    const updated = shapes.map((s) => (s.id === id ? { ...s, zIndex: (s.zIndex || 0) + 1 } : s));
    pushHistory(updated, layers, 'Ubah Urutan Tumpukan ke Depan');
  };

  const handleSendBackward = (id: string) => {
    const updated = shapes.map((s) => (s.id === id ? { ...s, zIndex: Math.max(0, (s.zIndex || 0) - 1) } : s));
    pushHistory(updated, layers, 'Ubah Urutan Tumpukan ke Belakang');
  };

  // Layer Management Handlers
  const handleUpdateLayers = (newLayers: LayerItem[], actionDesc: string = 'Ubah Pengaturan Layer') => {
    pushHistory(shapes, newLayers, actionDesc);
  };

  const handleAssignShapeToLayer = (shapeId: string, layerId: string) => {
    const targetLayer = layers.find((l) => l.id === layerId);
    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape || !targetLayer) return;

    const updatedShape: CADShape = {
      ...shape,
      layerId: targetLayer.id,
      layer: targetLayer.cadLayerName,
    };

    const updatedShapes = shapes.map((s) => (s.id === shapeId ? updatedShape : s));
    pushHistory(
      updatedShapes,
      layers,
      `Pindahkan ${shape.name} ke Layer ${targetLayer.name}`
    );
  };

  // Context Menu & Precision Actions
  const handleOpenPrecisionModalWithPoint = (point: Point) => {
    setPrecisionSpawnPoint(point);
    setIsPrecisionModalOpen(true);
  };

  const handleSpawnBasicShape = (
    type: 'rect' | 'circle' | 'triangle' | 'column' | 'table' | 'door' | 'window',
    point: Point
  ) => {
    const ppm = scaleSettings.pixelsPerMeter;
    let shape: CADShape;

    if (type === 'rect') {
      shape = {
        id: `shape-${Date.now()}`,
        name: 'Kotak Presisi',
        type: 'custom',
        category: 'custom',
        layer: 'CUSTOM',
        layerId: 'layer-custom',
        x: point.x - 0.75 * ppm,
        y: point.y - 0.75 * ppm,
        width: 1.5 * ppm,
        height: 1.5 * ppm,
        rotation: 0,
        lockAspectRatio: false,
        fillColor: '#ffffff',
        strokeColor: '#0f172a',
        strokeWidth: 2.5,
        opacity: 1,
        showDimensionLabels: true,
        zIndex: 5,
      };
    } else if (type === 'circle') {
      shape = {
        id: `shape-${Date.now()}`,
        name: 'Silinder / Lingkaran Ø1.5m',
        type: 'circle_room',
        category: 'custom',
        layer: 'CUSTOM',
        layerId: 'layer-custom',
        x: point.x - 0.75 * ppm,
        y: point.y - 0.75 * ppm,
        width: 1.5 * ppm,
        height: 1.5 * ppm,
        rotation: 0,
        lockAspectRatio: true,
        fillColor: '#f1f5f9',
        strokeColor: '#0f172a',
        strokeWidth: 2.5,
        opacity: 1,
        showDimensionLabels: true,
        zIndex: 5,
      };
    } else if (type === 'triangle') {
      const w = 1.5 * ppm;
      const h = 1.5 * ppm;
      shape = {
        id: `shape-${Date.now()}`,
        name: 'Segitiga Presisi 1.5m',
        type: 'polygon',
        category: 'custom',
        layer: 'CUSTOM',
        layerId: 'layer-custom',
        x: point.x - w / 2,
        y: point.y - h / 2,
        width: w,
        height: h,
        rotation: 0,
        lockAspectRatio: false,
        points: [
          { x: w / 2, y: 0 },
          { x: w, y: h },
          { x: 0, y: h },
        ],
        fillColor: '#f1f5f9',
        strokeColor: '#0f172a',
        strokeWidth: 2.5,
        opacity: 1,
        showDimensionLabels: true,
        zIndex: 5,
      };
    } else if (type === 'column') {
      shape = {
        id: `shape-${Date.now()}`,
        name: 'Kolom Struktur 30x30cm',
        type: 'column_rect',
        category: 'opening',
        layer: 'WALLS',
        layerId: 'layer-walls',
        x: point.x - 0.15 * ppm,
        y: point.y - 0.15 * ppm,
        width: 0.3 * ppm,
        height: 0.3 * ppm,
        rotation: 0,
        lockAspectRatio: true,
        fillColor: '#334155',
        strokeColor: '#0f172a',
        strokeWidth: 2.5,
        opacity: 1,
        hatchPattern: 'diagonal',
        showDimensionLabels: true,
        zIndex: 15,
      };
    } else if (type === 'table') {
      shape = {
        id: `shape-${Date.now()}`,
        name: 'Meja Kerja 1.4x0.8m',
        type: 'desk',
        category: 'furniture',
        layer: 'FURNITURE',
        layerId: 'layer-furniture',
        x: point.x - 0.7 * ppm,
        y: point.y - 0.4 * ppm,
        width: 1.4 * ppm,
        height: 0.8 * ppm,
        rotation: 0,
        lockAspectRatio: false,
        fillColor: '#fef3c7',
        strokeColor: '#b45309',
        strokeWidth: 1.8,
        opacity: 1,
        showDimensionLabels: true,
        zIndex: 6,
      };
    } else if (type === 'door') {
      shape = {
        id: `shape-${Date.now()}`,
        name: 'Pintu Swing 90cm',
        type: 'door_single',
        category: 'opening',
        layer: 'DOORS',
        layerId: 'layer-openings',
        x: point.x - 0.45 * ppm,
        y: point.y - 0.45 * ppm,
        width: 0.9 * ppm,
        height: 0.9 * ppm,
        rotation: 0,
        lockAspectRatio: true,
        fillColor: '#ffffff',
        strokeColor: '#dc2626',
        strokeWidth: 2,
        opacity: 1,
        zIndex: 12,
      };
    } else {
      shape = {
        id: `shape-${Date.now()}`,
        name: 'Jendela Kaca 1.2m',
        type: 'window_double',
        category: 'opening',
        layer: 'WINDOWS',
        layerId: 'layer-windows',
        x: point.x - 0.6 * ppm,
        y: point.y - 0.1 * ppm,
        width: 1.2 * ppm,
        height: 0.2 * ppm,
        rotation: 0,
        lockAspectRatio: false,
        strokeColor: '#0284c7',
        fillColor: '#bae6fd',
        strokeWidth: 2,
        opacity: 1,
        zIndex: 12,
      };
    }

    handleAddShape(shape);
  };

  const handleSpawnRoomFromContext = (
    type: string,
    name: string,
    wM: number,
    hM: number,
    point: Point
  ) => {
    const ppm = scaleSettings.pixelsPerMeter;
    const wPx = wM * ppm;
    const hPx = hM * ppm;

    const newRoom: CADShape = {
      id: `room-${Date.now()}`,
      name,
      type: type as any,
      category: 'room',
      layer: 'WALLS',
      layerId: 'layer-walls',
      x: point.x - wPx / 2,
      y: point.y - hPx / 2,
      width: wPx,
      height: hPx,
      rotation: 0,
      lockAspectRatio: false,
      fillColor: '#ffffff',
      strokeColor: '#0f172a',
      strokeWidth: 3,
      opacity: 1,
      hatchPattern: 'none',
      showDimensionLabels: true,
      zIndex: 2,
    };

    handleAddShape(newRoom);
  };

  const handleChangeShapeColor = (shape: CADShape, color: string) => {
    const updated: CADShape = {
      ...shape,
      fillColor: color,
    };
    handleCommitShapeUpdate(updated, `Ubah Warna ${shape.name}`);
  };

  // Custom Freeform Polygon State ("Bikin Shape Sendiri")
  const [isDrawingPolygon, setIsDrawingPolygon] = useState<boolean>(false);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);

  const handleStartDrawingPolygon = () => {
    setIsDrawingPolygon(true);
    setPolygonPoints([]);
    setSelectedShapeId(null);
    setActiveTool('polygon');
  };

  const handleCancelDrawingPolygon = () => {
    setIsDrawingPolygon(false);
    setPolygonPoints([]);
    setActiveTool('select');
  };

  const handleAddPolygonPoint = (pt: Point) => {
    setPolygonPoints((prev) => [...prev, pt]);
  };

  const handleFinishPolygon = () => {
    if (polygonPoints.length < 3) {
      handleCancelDrawingPolygon();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of polygonPoints) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    const width = Math.max(10, maxX - minX);
    const height = Math.max(10, maxY - minY);

    const localPoints = polygonPoints.map((p) => ({
      x: p.x - minX,
      y: p.y - minY,
    }));

    const newPolygonShape: CADShape = {
      id: `custom-poly-${Date.now()}`,
      name: `Shape Poligon (${polygonPoints.length} Sudut)`,
      type: 'polygon',
      category: 'custom',
      layer: 'CUSTOM',
      layerId: 'layer-custom',
      x: minX,
      y: minY,
      width,
      height,
      rotation: 0,
      lockAspectRatio: false,
      points: localPoints,
      fillColor: '#f1f5f9',
      strokeColor: '#0f172a',
      strokeWidth: 2.5,
      opacity: 1,
      hatchPattern: 'none',
      showDimensionLabels: true,
      zIndex: 5,
    };

    const updated = [...shapes, newPolygonShape];
    pushHistory(updated, layers, `Gambar Poligon Bebas (${polygonPoints.length} Titik)`);
    setSelectedShapeId(newPolygonShape.id);
    setIsDrawingPolygon(false);
    setPolygonPoints([]);
    setActiveTool('select');
  };

  // Modals state
  const [isScaleModalOpen, setIsScaleModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Template Loader
  const handleSelectTemplate = (template: FloorPlanTemplate) => {
    setProjectMetadata((prev) => ({
      ...prev,
      title: template.title,
      notes: template.description,
    }));
    pushHistory(template.shapes, layers, `Muat Template: ${template.title}`);
    setSelectedShapeId(template.shapes.length > 0 ? template.shapes[0].id : null);
  };

  const handleSelectEmptyCanvas = () => {
    setProjectMetadata((prev) => ({
      ...prev,
      title: 'Proyek Denah Baru',
    }));
    pushHistory([], layers, 'Buka Kanvas Kosong');
    setSelectedShapeId(null);
  };

  // Save / Load Project JSON
  const handleSaveJSON = () => {
    const projectData = {
      version: '1.2',
      metadata: projectMetadata,
      scaleSettings,
      gridSettings,
      layers,
      shapes,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(projectMetadata.title || 'proyek-denah').toLowerCase().replace(/\s+/g, '_')}.archiplan.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTriggerLoadJSON = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.shapes) {
          const loadedLayers = parsed.layers || INITIAL_LAYERS;
          pushHistory(parsed.shapes, loadedLayers, `Buka File ${file.name}`);
          if (parsed.metadata) setProjectMetadata(parsed.metadata);
          if (parsed.scaleSettings) setScaleSettings(parsed.scaleSettings);
          if (parsed.gridSettings) setGridSettings(parsed.gridSettings);
        }
      } catch (err) {
        alert('Format file JSON proyek tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export High-Res PNG
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const svgSize = svgEl.getBoundingClientRect();

    const scale = 2;
    canvas.width = svgSize.width * scale;
    canvas.height = svgSize.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = canvasTheme === 'blueprint' ? '#0c2340' : '#ffffff';
    ctx.fillRect(0, 0, svgSize.width, svgSize.height);

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${(projectMetadata.title || 'denah').toLowerCase().replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = url;
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Special handling for Escape when inside input: blur field
      if (isInput) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      // 1. Toggle Menu Bentuk / Shape Library (Q or Ctrl+Q) - Top Priority
      if (e.key.toLowerCase() === 'q') {
        e.preventDefault();
        e.stopPropagation();
        setIsLibraryOpen((prev) => {
          const next = !prev;
          showToast(next ? 'Menu Bentuk Ditampilkan (Q)' : 'Menu Bentuk Disembunyikan (Q)', 'action');
          return next;
        });
        return;
      }

      // 2. Toggle Menu Detail Ukuran / Inspector (W or Ctrl+W) - Top Priority
      // Note: e.preventDefault() is crucial here to prevent the browser from closing the tab if Ctrl is pressed!
      if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        e.stopPropagation();
        setIsInspectorOpen((prev) => {
          const next = !prev;
          showToast(next ? 'Menu Detail Ditampilkan (W)' : 'Menu Detail Disembunyikan (W)', 'action');
          return next;
        });
        return;
      }

      // 3. Save Project (Ctrl+S / Cmd+S)
      if (isModifier && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveJSON();
        showToast('Proyek Disimpan ke File JSON (Ctrl+S)', 'action');
        return;
      }

      // 4. Open Project (Ctrl+O / Cmd+O)
      if (isModifier && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleTriggerLoadJSON();
        return;
      }

      // 5. Export Modal (Ctrl+E / Cmd+E)
      if (isModifier && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportModalOpen(true);
        return;
      }

      // 6. Undo / Redo
      if (isModifier && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      } else if (isModifier && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // 7. Duplicate (Ctrl+D)
      if (isModifier && e.key.toLowerCase() === 'd') {
        if (selectedShapeId) {
          e.preventDefault();
          handleDuplicateShape(selectedShapeId, 0.5, 0.5);
        }
        return;
      }

      // 8. Delete (Del / Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedShapeId) {
          e.preventDefault();
          handleDeleteShape(selectedShapeId);
        }
        return;
      }

      // 9. Reset Zoom to 100% (Ctrl+0)
      if (isModifier && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
        showToast('Zoom Direset ke 100% (Ctrl+0)', 'action');
        return;
      }

      // 10. Fit to screen (F)
      if (!isModifier && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFitView();
        showToast('Tampilan Denah Dipusatkan (F)', 'action');
        return;
      }

      // 11. Toggle Grid (G)
      if (!isModifier && e.key.toLowerCase() === 'g') {
        setGridSettings((prev) => {
          const next = !prev.enabled;
          showToast(next ? 'Grid: Tampil (G)' : 'Grid: Tersembunyi (G)', 'action');
          return { ...prev, enabled: next };
        });
        return;
      }

      // 12. Toggle Snap to Grid (M)
      if (!isModifier && e.key.toLowerCase() === 'm') {
        setGridSettings((prev) => {
          const next = !prev.snapToGrid;
          showToast(next ? 'Snap ke Grid: Aktif (M)' : 'Snap ke Grid: Nonaktif (M)', 'action');
          return { ...prev, snapToGrid: next };
        });
        return;
      }

      // 13. Zoom in / Zoom out (+ / -)
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((prev) => Math.min(prev * 1.15, 5.0));
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((prev) => Math.max(prev / 1.15, 0.04));
        return;
      }

      // 14. Escape key
      if (e.key === 'Escape') {
        if (isDrawingPolygon) {
          handleCancelDrawingPolygon();
        } else if (selectedShapeId) {
          setSelectedShapeId(null);
        } else {
          setIsScaleModalOpen(false);
          setIsExportModalOpen(false);
          setIsTemplateModalOpen(false);
          setIsGuideModalOpen(false);
          setIsPrecisionModalOpen(false);
          setQuickEditShape(null);
        }
        return;
      }

      // 15. Single letter tools
      if (!isModifier) {
        if (e.key.toLowerCase() === 'v') setActiveTool('select');
        if (e.key.toLowerCase() === 'p') handleStartDrawingPolygon();
        if (e.key.toLowerCase() === 'h') setActiveTool('pan');
        if (e.key.toLowerCase() === 'l') setIsLayerPanelOpen((prev) => !prev);
        if (e.key.toLowerCase() === 't') setIsTemplateModalOpen(true);
        if (e.key === '?' || e.key === '/') setIsGuideModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    selectedShapeId,
    handleUndo,
    handleRedo,
    shapes,
    scaleSettings,
    isDrawingPolygon,
    handleDuplicateShape,
    handleDeleteShape,
    handleSaveJSON,
    handleTriggerLoadJSON,
    handleFitView,
    handleStartDrawingPolygon,
    handleCancelDrawingPolygon,
  ]);

  const selectedShape = shapes.find((s) => s.id === selectedShapeId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Hidden file input for opening project */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Architectural Toolbar */}
      <Toolbar
        projectMetadata={projectMetadata}
        onUpdateMetadata={setProjectMetadata}
        scaleSettings={scaleSettings}
        gridSettings={gridSettings}
        onToggleGrid={() => setGridSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
        onToggleSnap={() => setGridSettings((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
        onOpenScaleModal={() => setIsScaleModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        isLayerPanelOpen={isLayerPanelOpen}
        onToggleLayerPanel={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
        isLibraryOpen={isLibraryOpen}
        onToggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        activeLayerCount={layers.filter((l) => l.visible).length}
        activeTool={activeTool}
        onChangeTool={(tool) => {
          setActiveTool(tool);
          if (tool === 'polygon') handleStartDrawingPolygon();
          else if (isDrawingPolygon) handleCancelDrawingPolygon();
        }}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        undoActionDescription={historyIndex > 0 ? history[historyIndex].description : undefined}
        redoActionDescription={
          historyIndex < history.length - 1 ? history[historyIndex + 1].description : undefined
        }
        historyList={history.map((h) => ({ description: h.description, timestamp: h.timestamp }))}
        currentHistoryIndex={historyIndex}
        onJumpToHistory={handleJumpToHistory}
        canvasTheme={canvasTheme}
        onChangeTheme={setCanvasTheme}
        onSaveJSON={handleSaveJSON}
        onLoadJSON={handleTriggerLoadJSON}
        autoWallJoinActive={mouseSensitivity.autoWallJoin}
      />

      {/* Floating Action / Undo / Redo Toast Notification */}
      {actionToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-slate-700 backdrop-blur-md px-4 py-2 rounded-xl text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {actionToast.type === 'undo' && <RotateCcw className="w-4 h-4 text-amber-400" />}
          {actionToast.type === 'redo' && <RotateCw className="w-4 h-4 text-blue-400" />}
          {actionToast.type === 'action' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span className="font-medium text-slate-100">{actionToast.message}</span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({historyIndex + 1}/{history.length})
          </span>
        </div>
      )}

      {/* Main Workspace (Left Library, Center Canvas, Layer Manager / Right Precision Inspector) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Shape Library & Presets (Can be hidden / slid out) */}
        {isLibraryOpen && (
          <div className="h-full shrink-0 z-20 animate-in slide-in-from-left duration-200 flex">
            <ShapeLibrary
              scaleSettings={scaleSettings}
              onAddShape={handleAddShape}
              isDrawingPolygon={isDrawingPolygon}
              onStartDrawingPolygon={handleStartDrawingPolygon}
              onCancelDrawingPolygon={handleCancelDrawingPolygon}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              onLoadTemplate={(type) => {
                if (type === 'empty') handleSelectEmptyCanvas();
                else setIsTemplateModalOpen(true);
              }}
              onClose={() => setIsLibraryOpen(false)}
              onOpenPrecisionModal={() => {
                setPrecisionSpawnPoint({ x: 250, y: 200 });
                setIsPrecisionModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Floating edge tab when Left Shape Library is hidden */}
        {!isLibraryOpen && (
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-slate-900/95 hover:bg-slate-800 border border-l-0 border-slate-700 text-slate-300 hover:text-white px-2 py-3 rounded-r-xl shadow-2xl flex flex-col items-center gap-1.5 z-20 transition-all cursor-pointer group"
            title="Buka Menu Bentuk & Ruangan (Q)"
          >
            <PanelLeftOpen className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="[writing-mode:vertical-lr] text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-200">
              Menu Bentuk
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/80 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              Q
            </span>
          </button>
        )}

        {/* Center: CAD Drawing Canvas */}
        <Canvas
          shapes={shapes}
          selectedShapeId={selectedShapeId}
          onSelectShape={(id) => {
            setSelectedShapeId(id);
            // Do NOT automatically force inspector open on every click per user request
          }}
          onOpenInspector={() => setIsInspectorOpen(true)}
          onUpdateShape={handleUpdateShapeLive}
          onCommitShapeUpdate={handleCommitShapeUpdate}
          scaleSettings={scaleSettings}
          gridSettings={gridSettings}
          layers={layers}
          activeTool={activeTool}
          canvasTheme={canvasTheme}
          zoom={zoom}
          onZoomChange={setZoom}
          panOffset={panOffset}
          onPanChange={setPanOffset}
          onCursorMove={setCursorPos}
          isDrawingPolygon={isDrawingPolygon}
          polygonPoints={polygonPoints}
          onAddPolygonPoint={handleAddPolygonPoint}
          onFinishPolygon={handleFinishPolygon}
          onCancelPolygon={handleCancelDrawingPolygon}
          svgRef={svgRef}
          onOpenTemplates={() => setIsTemplateModalOpen(true)}
          onOpenGuide={() => setIsGuideModalOpen(true)}
          onQuickAddRoom={handleQuickAddRoom}
          onStartDrawingPolygon={handleStartDrawingPolygon}
          onOpenContextMenu={(screenX, screenY, canvasPoint, shape) => {
            setContextMenuTarget({ screenX, screenY, canvasPoint, shape });
          }}
          sensitivitySettings={mouseSensitivity}
          onUpdateSensitivity={setMouseSensitivity}
          onCreateBaseRoom={handleCreateBaseRoom}
          onFitView={handleFitView}
        />

        {/* Layer Manager Drawer / Sidebar (when toggled open) */}
        {isLayerPanelOpen && (
          <div className="w-72 border-l border-slate-800 shrink-0 z-20 animate-in slide-in-from-right duration-200">
            <LayerManager
              layers={layers}
              shapes={shapes}
              selectedShapeId={selectedShapeId}
              onUpdateLayers={handleUpdateLayers}
              onAssignShapeToLayer={handleAssignShapeToLayer}
            />
          </div>
        )}

        {/* Right Sidebar: Precision Numeric Inspector (Collapsible / Slideable) */}
        {isInspectorOpen && (
          <div className="w-80 border-l border-slate-800 shrink-0 z-20 animate-in slide-in-from-right duration-200 h-full flex flex-col">
            <Inspector
              selectedShape={selectedShape}
              scaleSettings={scaleSettings}
              layers={layers}
              onUpdateShape={handleCommitShapeUpdate}
              onDeleteShape={handleDeleteShape}
              onDuplicateShape={handleDuplicateShape}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onClose={() => setIsInspectorOpen(false)}
            />
          </div>
        )}

        {/* Floating edge tab when Inspector is hidden */}
        {!isInspectorOpen && (
          <button
            onClick={() => setIsInspectorOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-slate-900/95 hover:bg-slate-800 border border-r-0 border-slate-700 text-slate-300 hover:text-white px-2 py-3 rounded-l-xl shadow-2xl flex flex-col items-center gap-1.5 z-20 transition-all cursor-pointer group"
            title="Buka Menu Detail Ukuran (W)"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-200">
              Detail {selectedShape ? `(${selectedShape.name})` : 'Ukuran'}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/80 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              W
            </span>
          </button>
        )}
      </div>

      {/* Bottom Status & Dimensions Bar */}
      <DimensionsBar
        cursorPos={cursorPos}
        scaleSettings={scaleSettings}
        shapes={shapes}
        zoom={zoom}
      />

      {/* Interactive Guide & Instruction Modal */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
      />

      {/* Template Catalog Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        onSelectEmptyCanvas={handleSelectEmptyCanvas}
      />

      {/* Scale & Grid Calibration Modal */}
      <ScaleModal
        isOpen={isScaleModalOpen}
        onClose={() => setIsScaleModalOpen(false)}
        scaleSettings={scaleSettings}
        onSaveScale={setScaleSettings}
        gridSettings={gridSettings}
        onSaveGrid={setGridSettings}
      />

      {/* Professional PDF & CAD Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        shapes={shapes.filter((s) => {
          const l = layers.find((layer) => layer.id === s.layerId || layer.cadLayerName === s.layer);
          return !l || l.visible !== false;
        })}
        scaleSettings={scaleSettings}
        gridSettings={gridSettings}
        layers={layers}
        projectMetadata={projectMetadata}
        onUpdateMetadata={setProjectMetadata}
        onExportPNG={handleExportPNG}
      />

      {/* Right-Click Architectural Context Menu (Empty Canvas & Object Options) */}
      <ContextMenu
        target={contextMenuTarget}
        scaleSettings={scaleSettings}
        onClose={() => setContextMenuTarget(null)}
        onOpenQuickEditShape={(shape) => {
          setQuickEditShape(shape);
          setContextMenuTarget(null);
        }}
        onOpenInspector={() => {
          setIsInspectorOpen(true);
          setContextMenuTarget(null);
        }}
        onDuplicateShape={(id) => {
          handleDuplicateShape(id, 0.5, 0.5);
          setContextMenuTarget(null);
        }}
        onBringForward={(id) => {
          handleBringForward(id);
          setContextMenuTarget(null);
        }}
        onSendBackward={(id) => {
          handleSendBackward(id);
          setContextMenuTarget(null);
        }}
        onDeleteShape={(id) => {
          handleDeleteShape(id);
          setContextMenuTarget(null);
        }}
        onChangeShapeColor={(shape, color) => {
          handleChangeShapeColor(shape, color);
          setContextMenuTarget(null);
        }}
        onOpenPrecisionModal={(pt) => {
          handleOpenPrecisionModalWithPoint(pt);
          setContextMenuTarget(null);
        }}
        onSpawnRoom={(type, name, wM, hM, pt) => {
          handleSpawnRoomFromContext(type, name, wM, hM, pt);
          setContextMenuTarget(null);
        }}
        onSpawnBasicShape={(type, pt) => {
          handleSpawnBasicShape(type, pt);
          setContextMenuTarget(null);
        }}
        onStartDrawingPolygon={() => {
          handleStartDrawingPolygon();
          setContextMenuTarget(null);
        }}
        onOpenTemplates={() => {
          setIsTemplateModalOpen(true);
          setContextMenuTarget(null);
        }}
        onToggleLeftSidebar={() => {
          setIsLibraryOpen((prev) => !prev);
          setContextMenuTarget(null);
        }}
      />

      {/* Modal: Bikin Shape / Benda Presisi dengan Input Angka Spesifik */}
      <PrecisionShapeModal
        isOpen={isPrecisionModalOpen}
        onClose={() => setIsPrecisionModalOpen(false)}
        scaleSettings={scaleSettings}
        spawnPosition={precisionSpawnPoint}
        onAddShape={(newShape) => {
          handleAddShape(newShape);
          setIsPrecisionModalOpen(false);
        }}
      />

      {/* Modal: Edit Cepat Ukuran Presisi Bentuk (Klik Kanan -> Edit Ukuran) */}
      <QuickEditShapeModal
        isOpen={!!quickEditShape}
        shape={quickEditShape}
        scaleSettings={scaleSettings}
        onClose={() => setQuickEditShape(null)}
        onUpdateShape={(updatedShape, actionDesc) => {
          handleCommitShapeUpdate(updatedShape, actionDesc);
          setQuickEditShape(null);
        }}
        onDuplicateShape={(id) => {
          handleDuplicateShape(id, 0.5, 0.5);
          setQuickEditShape(null);
        }}
        onDeleteShape={(id) => {
          handleDeleteShape(id);
          setQuickEditShape(null);
        }}
      />
    </div>
  );
}
