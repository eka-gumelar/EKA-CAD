export type Unit = 'm' | 'cm' | 'mm' | 'ft';

export type ShapeCategory = 
  | 'room' 
  | 'custom' 
  | 'opening' 
  | 'wall' 
  | 'column' 
  | 'furniture' 
  | 'dimension' 
  | 'text';

export type ShapeType = 
  | 'rect_room'
  | 'l_room'
  | 't_room'
  | 'circle_room'
  | 'polygon'
  | 'wall_line'
  | 'door_single'
  | 'door_double'
  | 'door_sliding'
  | 'window_double'
  | 'column_rect'
  | 'column_round'
  | 'bed_double'
  | 'bed_single'
  | 'sofa_3seat'
  | 'sofa_l'
  | 'dining_table'
  | 'desk'
  | 'kitchen_counter'
  | 'bathroom_toilet'
  | 'bathroom_tub'
  | 'dimension_line'
  | 'text_note'
  | 'custom';

export type CADLayer = string;

export interface LayerItem {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  cadLayerName: string;
}

export interface HistoryEntry {
  shapes: CADShape[];
  layers?: LayerItem[];
  description: string;
  timestamp: number;
}

export type TemplateCategory = 'apartment' | 'house' | 'office' | 'commercial';

export interface FloorPlanTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  categoryLabel: string;
  areaM2: number;
  dimensions: string;
  roomCount: number;
  description: string;
  features: string[];
  shapes: CADShape[];
  badge?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface CADShape {
  id: string;
  name: string;
  type: ShapeType;
  category: ShapeCategory;
  layer: CADLayer;
  layerId?: string;
  
  // Position in pixels (canvas space)
  x: number;
  y: number;
  
  // Dimensions in pixels
  width: number;
  height: number;
  
  // Rotation in degrees
  rotation: number;
  
  // Aspect ratio lock
  lockAspectRatio: boolean;
  
  // For freeform polygon / custom shape
  points?: Point[]; // Local coordinates relative to (x, y)
  
  // Architectural attributes
  wallThickness?: number; // In meters
  roomType?: string;
  areaM2?: number;
  showDimensionLabels?: boolean;
  
  // Styling
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  hatchPattern?: 'none' | 'grid' | 'diagonal' | 'dots' | 'wood' | 'tile';
  autoAvoidLabels?: boolean; // Override collision-free label adjustment per shape
  
  // Text note specific
  textContent?: string;
  fontSize?: number;

  // Custom data
  zIndex: number;
}

export interface GridSettings {
  enabled: boolean;
  size: number; // in meters (e.g. 0.5m or 1.0m)
  snapToGrid: boolean;
  snapToShapes: boolean;
  subdivisions: number;
}

export interface MouseSensitivitySettings {
  panSensitivity: number; // 0.2 to 3.0 (default 1.0)
  zoomSensitivity: number; // 0.2 to 3.0 (default 1.0)
  invertWheelZoom: boolean; // default false
  autoWallJoin: boolean; // default true
  showSmartGuides: boolean; // default true
  autoAvoidDimensionLabels?: boolean; // default true (smart anti-overlap label positioning)
}

export interface SmartLabelResult {
  x: number;
  y: number;
  isDisplaced: boolean;
  offsetDistance: number;
  placement: 'center' | 'north' | 'south' | 'east' | 'west' | 'custom';
  leaderLine?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface SmartDimensionBadgesResult {
  widthBadge: {
    x: number;
    y: number;
    isFlipped: boolean;
    placement: 'top-outer' | 'top-inner' | 'bottom-outer' | 'bottom-inner' | 'custom';
  };
  heightBadge: {
    x: number;
    y: number;
    isFlipped: boolean;
    placement: 'left-outer' | 'left-inner' | 'right-outer' | 'right-inner' | 'custom';
  };
}

export interface SmartGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number; // canvas X or Y
  start: number;
  end: number;
  label?: string;
  snapKind?: 'edge' | 'center' | 'wall_abut';
}

export interface WallJoinSegment {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'horizontal' | 'vertical' | 'corner';
  strokeColor: string;
  fillColor: string;
}

export interface ScaleSettings {
  pixelsPerMeter: number; // e.g. 50 pixels = 1 meter
  unit: Unit;
  ratioLabel: string; // e.g. "1:50" or "1:100"
}

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface ProjectMetadata {
  title: string;
  projectName: string;
  architect: string;
  client: string;
  date: string;
  revision: string;
  notes: string;
}

export interface ExportPDFOptions {
  paperSize: 'a4' | 'a3';
  orientation: 'landscape' | 'portrait';
  includeTitleBlock: boolean;
  includeGrid: boolean;
  includeDimensions: boolean;
  includeScaleBar: boolean;
  includeNorthArrow: boolean;
}

export interface ExportDXFOptions {
  dxfUnit: 'mm' | 'm';
  includeDimensions: boolean;
  includeFurniture: boolean;
  includeLabels: boolean;
}

export interface DistanceIndicator {
  id: string;
  axis: 'x' | 'y';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distancePx: number;
  distanceFormatted: string;
  direction: 'left' | 'right' | 'top' | 'bottom';
  colliderName?: string;
  isEnclosingWall?: boolean;
}
