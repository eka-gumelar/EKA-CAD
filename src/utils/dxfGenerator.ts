import { CADShape, ExportDXFOptions } from '../types/cad';
import { pxToMeters } from './units';

/**
 * Generates an AutoCAD-compatible DXF (Drawing Exchange Format) string
 * Supports layers, polylines, lines, circles, arcs, and text.
 */
export function generateDXF(
  shapes: CADShape[],
  pixelsPerMeter: number,
  options: ExportDXFOptions
): string {
  const isMm = options.dxfUnit === 'mm';
  const unitScale = isMm ? 1000 : 1; // 1 meter = 1000 mm

  // Helper to convert canvas pixel to CAD coordinate
  // In CAD, Y is upwards, in canvas Y is downwards, so we negate Y
  const toCADX = (px: number) => (pxToMeters(px, pixelsPerMeter) * unitScale).toFixed(3);
  const toCADY = (py: number) => (-pxToMeters(py, pixelsPerMeter) * unitScale).toFixed(3);
  const toCADDist = (pxDist: number) => (pxToMeters(pxDist, pixelsPerMeter) * unitScale).toFixed(3);

  const lines: string[] = [];

  // DXF HEADER
  lines.push('0', 'SECTION');
  lines.push('2', 'HEADER');
  lines.push('9', '$ACADVER');
  lines.push('1', 'AC1015'); // AutoCAD 2000 format
  lines.push('9', '$INSUNITS');
  lines.push('70', isMm ? '4' : '6'); // 4 = mm, 6 = meters
  lines.push('9', '$MEASUREMENT');
  lines.push('70', '1'); // 1 = Metric
  lines.push('0', 'ENDSEC');

  // DXF TABLES
  lines.push('0', 'SECTION');
  lines.push('2', 'TABLES');
  
  // LAYER TABLE
  lines.push('0', 'TABLE');
  lines.push('2', 'LAYER');
  lines.push('70', '7'); // Number of layers

  const layerDefs = [
    { name: '0', color: 7 },
    { name: 'WALLS', color: 7 }, // White
    { name: 'DOORS', color: 1 }, // Red
    { name: 'WINDOWS', color: 4 }, // Cyan
    { name: 'FURNITURE', color: 8 }, // Gray
    { name: 'DIMENSIONS', color: 3 }, // Green
    { name: 'TEXT', color: 2 }, // Yellow
    { name: 'CUSTOM', color: 6 }, // Magenta
  ];

  for (const l of layerDefs) {
    lines.push('0', 'LAYER');
    lines.push('2', l.name);
    lines.push('70', '0');
    lines.push('62', l.color.toString());
    lines.push('6', 'CONTINUOUS');
  }
  lines.push('0', 'ENDTAB');
  lines.push('0', 'ENDSEC');

  // DXF ENTITIES
  lines.push('0', 'SECTION');
  lines.push('2', 'ENTITIES');

  for (const shape of shapes) {
    if (shape.layer === 'FURNITURE' && !options.includeFurniture) continue;
    if (shape.layer === 'DIMENSIONS' && !options.includeDimensions) continue;
    if (shape.layer === 'TEXT' && !options.includeLabels) continue;

    const layerName = shape.layer || 'WALLS';

    // 1. Polygon / Freeform Custom Shape
    if (shape.type === 'polygon' && shape.points && shape.points.length >= 3) {
      lines.push('0', 'LWPOLYLINE');
      lines.push('8', layerName);
      lines.push('90', shape.points.length.toString());
      lines.push('70', '1'); // 1 = Closed polyline
      lines.push('43', '0'); // Constant width

      for (const pt of shape.points) {
        const absX = shape.x + pt.x;
        const absY = shape.y + pt.y;
        lines.push('10', toCADX(absX));
        lines.push('20', toCADY(absY));
      }
    }
    // 2. Rectangular Room / Box
    else if (shape.type === 'rect_room' || shape.type === 'column_rect') {
      const x0 = shape.x;
      const y0 = shape.y;
      const x1 = shape.x + shape.width;
      const y1 = shape.y + shape.height;

      lines.push('0', 'LWPOLYLINE');
      lines.push('8', layerName);
      lines.push('90', '4');
      lines.push('70', '1'); // closed
      lines.push('43', '0');

      // 4 corners
      lines.push('10', toCADX(x0), '20', toCADY(y0));
      lines.push('10', toCADX(x1), '20', toCADY(y0));
      lines.push('10', toCADX(x1), '20', toCADY(y1));
      lines.push('10', toCADX(x0), '20', toCADY(y1));
    }
    // 3. L-Shaped Room
    else if (shape.type === 'l_room') {
      const w = shape.width;
      const h = shape.height;
      const cutW = w * 0.5;
      const cutH = h * 0.5;
      const x = shape.x;
      const y = shape.y;

      // L shape points: (0,0) -> (w,0) -> (w, cutH) -> (cutW, cutH) -> (cutW, h) -> (0, h)
      const lPoints = [
        { x: x, y: y },
        { x: x + w, y: y },
        { x: x + w, y: y + cutH },
        { x: x + cutW, y: y + cutH },
        { x: x + cutW, y: y + h },
        { x: x, y: y + h },
      ];

      lines.push('0', 'LWPOLYLINE');
      lines.push('8', layerName);
      lines.push('90', '6');
      lines.push('70', '1');
      lines.push('43', '0');
      for (const pt of lPoints) {
        lines.push('10', toCADX(pt.x), '20', toCADY(pt.y));
      }
    }
    // 4. Circular Room or Round Column
    else if (shape.type === 'circle_room' || shape.type === 'column_round') {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      const radius = Math.min(shape.width, shape.height) / 2;

      lines.push('0', 'CIRCLE');
      lines.push('8', layerName);
      lines.push('10', toCADX(cx));
      lines.push('20', toCADY(cy));
      lines.push('30', '0.0');
      lines.push('40', toCADDist(radius));
    }
    // 5. Door Single (Door line + swing arc)
    else if (shape.type === 'door_single') {
      // Base frame line
      lines.push('0', 'LINE');
      lines.push('8', 'DOORS');
      lines.push('10', toCADX(shape.x));
      lines.push('20', toCADY(shape.y));
      lines.push('30', '0');
      lines.push('11', toCADX(shape.x + shape.width));
      lines.push('21', toCADY(shape.y));
      lines.push('31', '0');

      // Door panel swing line
      lines.push('0', 'LINE');
      lines.push('8', 'DOORS');
      lines.push('10', toCADX(shape.x));
      lines.push('20', toCADY(shape.y));
      lines.push('30', '0');
      lines.push('11', toCADX(shape.x));
      lines.push('21', toCADY(shape.y + shape.width));
      lines.push('31', '0');

      // Arc
      lines.push('0', 'ARC');
      lines.push('8', 'DOORS');
      lines.push('10', toCADX(shape.x));
      lines.push('20', toCADY(shape.y));
      lines.push('30', '0');
      lines.push('40', toCADDist(shape.width));
      lines.push('50', '270');
      lines.push('51', '360');
    }
    // 6. Generic furniture / opening bounding box with X or details
    else {
      const x0 = shape.x;
      const y0 = shape.y;
      const x1 = shape.x + shape.width;
      const y1 = shape.y + shape.height;

      lines.push('0', 'LWPOLYLINE');
      lines.push('8', layerName);
      lines.push('90', '4');
      lines.push('70', '1');
      lines.push('43', '0');
      lines.push('10', toCADX(x0), '20', toCADY(y0));
      lines.push('10', toCADX(x1), '20', toCADY(y0));
      lines.push('10', toCADX(x1), '20', toCADY(y1));
      lines.push('10', toCADX(x0), '20', toCADY(y1));
    }

    // Add Text label if room or name requested
    if (options.includeLabels && shape.name) {
      const textX = shape.x + shape.width / 2;
      const textY = shape.y + shape.height / 2;
      const textHeight = Math.max(0.2 * unitScale, (shape.height * 0.08 * unitScale) / pixelsPerMeter);

      lines.push('0', 'TEXT');
      lines.push('8', 'TEXT');
      lines.push('10', toCADX(textX));
      lines.push('20', toCADY(textY));
      lines.push('30', '0.0');
      lines.push('40', textHeight.toFixed(2));
      lines.push('1', shape.name);
      lines.push('72', '1'); // Centered
      lines.push('11', toCADX(textX));
      lines.push('21', toCADY(textY));
      lines.push('31', '0.0');
    }
  }

  lines.push('0', 'ENDSEC');
  lines.push('0', 'EOF');

  return lines.join('\n');
}

/**
 * Triggers a browser download of the generated DXF file
 */
export function downloadDXF(
  shapes: CADShape[],
  pixelsPerMeter: number,
  options: ExportDXFOptions,
  filename: string = 'denah-arsitektur.dxf'
): void {
  const dxfContent = generateDXF(shapes, pixelsPerMeter, options);
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
