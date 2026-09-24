import jsPDF from 'jspdf';
import { CADShape, ExportPDFOptions, ProjectMetadata, ScaleSettings } from '../types/cad';
import { calculateShapeAreaM2, formatArea, pxToMeters } from './units';

export async function exportToPDF(
  shapes: CADShape[],
  scaleSettings: ScaleSettings,
  projectMetadata: ProjectMetadata,
  options: ExportPDFOptions
): Promise<void> {
  const isLandscape = options.orientation === 'landscape';
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: options.paperSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10; // 10mm border margin

  // 1. Draw Architectural Outer Frame & Inner Border
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  doc.setLineWidth(0.3);
  doc.rect(margin + 2, margin + 2, pageWidth - margin * 2 - 4, pageHeight - margin * 2 - 4);

  // 2. Title Block (Kop Gambar Arsitektur) at bottom or right
  const titleBlockHeight = 28;
  const tbX = margin + 2;
  const tbY = pageHeight - margin - 2 - titleBlockHeight;
  const tbWidth = pageWidth - margin * 2 - 4;

  if (options.includeTitleBlock) {
    // Title block container
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(tbX, tbY, tbWidth, titleBlockHeight, 'FD');
    doc.line(tbX, tbY, tbX + tbWidth, tbY);

    // Title Block Grid Divisions
    const col1 = tbX + 60;
    const col2 = tbX + 130;
    const col3 = tbX + tbWidth - 55;

    doc.line(col1, tbY, col1, tbY + titleBlockHeight);
    doc.line(col2, tbY, col2, tbY + titleBlockHeight);
    doc.line(col3, tbY, col3, tbY + titleBlockHeight);

    // Column 1: Organization / Firm
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('ARCHIPLAN STUDIO', tbX + 5, tbY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Architectural Design & Planning', tbX + 5, tbY + 14);
    doc.text(`Arsitek: ${projectMetadata.architect || 'Principal Architect'}`, tbX + 5, tbY + 20);
    doc.text(`Klien: ${projectMetadata.client || 'General Client'}`, tbX + 5, tbY + 25);

    // Column 2: Project Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(projectMetadata.projectName || 'PROYEK DESAIN ARSITEKTUR', col1 + 5, tbY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Judul Gambar : ${projectMetadata.title || 'DENAH TATA RUANG'}`, col1 + 5, tbY + 15);
    
    // Calculate total area
    const totalAreaM2 = shapes
      .filter(s => s.category === 'room')
      .reduce((sum, s) => sum + calculateShapeAreaM2(s, scaleSettings.pixelsPerMeter), 0);
    doc.text(`Total Luas Denah : ${totalAreaM2 > 0 ? formatArea(totalAreaM2, 'm') : '-'}`, col1 + 5, tbY + 22);

    // Column 3: Scale & North Arrow
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Skala: ${scaleSettings.ratioLabel || '1:100'}`, col2 + 5, tbY + 8);
    doc.text(`Satuan: ${scaleSettings.unit.toUpperCase()}`, col2 + 5, tbY + 15);
    doc.text(`Tanggal: ${projectMetadata.date || new Date().toLocaleDateString('id-ID')}`, col2 + 5, tbY + 22);

    // Column 4: Sheet Number & Stamp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('NO. LEMBAR', col3 + 5, tbY + 8);
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(projectMetadata.revision ? `A-01 (${projectMetadata.revision})` : 'A-01', col3 + 5, tbY + 18);
  }

  // 3. Graphic Scale Bar (Skala Grafis)
  if (options.includeScaleBar) {
    const sbX = margin + 10;
    const sbY = options.includeTitleBlock ? tbY - 12 : pageHeight - margin - 15;
    const segmentWidth = 10; // mm
    const barHeight = 2.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('SKALA GRAFIS', sbX, sbY - 2);

    for (let i = 0; i < 4; i++) {
      const segX = sbX + i * segmentWidth;
      doc.setFillColor(i % 2 === 0 ? 30 : 255, i % 2 === 0 ? 41 : 255, i % 2 === 0 ? 59 : 255);
      doc.rect(segX, sbY, segmentWidth, barHeight, 'FD');
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.2);
      doc.rect(segX, sbY, segmentWidth, barHeight, 'D');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(`${i * 1}m`, segX - 1, sbY + barHeight + 3);
    }
    doc.text('4m', sbX + 4 * segmentWidth - 1, sbY + barHeight + 3);
  }

  // 4. North Arrow (Arah Mata Angin)
  if (options.includeNorthArrow) {
    const naX = pageWidth - margin - 22;
    const naY = margin + 18;

    // Circle
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.4);
    doc.circle(naX, naY, 6, 'D');

    // Arrow pointer
    doc.setFillColor(30, 41, 59);
    doc.triangle(naX, naY - 5.5, naX - 2.5, naY + 1, naX, naY, 'F');
    doc.setFillColor(203, 213, 225);
    doc.triangle(naX, naY - 5.5, naX + 2.5, naY + 1, naX, naY, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('U', naX - 1.5, naY - 7.5);
  }

  // 5. Draw Floor Plan Entities to PDF
  // Determine bounds of shapes
  if (shapes.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const s of shapes) {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    }

    const planWidthPx = Math.max(10, maxX - minX);
    const planHeightPx = Math.max(10, maxY - minY);

    // Available drawing area in mm
    const drawAreaX = margin + 10;
    const drawAreaY = margin + 15;
    const drawAreaW = pageWidth - margin * 2 - 20;
    const drawAreaH = options.includeTitleBlock ? tbY - drawAreaY - 10 : pageHeight - margin * 2 - 20;

    // Calculate scale factor from canvas pixels to PDF mm
    const scaleFactor = Math.min(drawAreaW / planWidthPx, drawAreaH / planHeightPx) * 0.9;

    // Center the drawing inside available bounds
    const offsetX = drawAreaX + (drawAreaW - planWidthPx * scaleFactor) / 2 - minX * scaleFactor;
    const offsetY = drawAreaY + (drawAreaH - planHeightPx * scaleFactor) / 2 - minY * scaleFactor;

    // Render each shape
    for (const shape of shapes) {
      const sx = shape.x * scaleFactor + offsetX;
      const sy = shape.y * scaleFactor + offsetY;
      const sw = shape.width * scaleFactor;
      const sh = shape.height * scaleFactor;

      // Fill color
      if (shape.category === 'room') {
        doc.setFillColor(241, 245, 249); // light slate
      } else if (shape.category === 'wall' || shape.category === 'column') {
        doc.setFillColor(51, 65, 85); // dark slate wall
      } else {
        doc.setFillColor(255, 255, 255);
      }

      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(shape.category === 'wall' || shape.category === 'room' ? 0.4 : 0.2);

      if (shape.type === 'rect_room' || shape.type === 'column_rect') {
        doc.rect(sx, sy, sw, sh, shape.category === 'room' ? 'FD' : 'FD');
      } else if (shape.type === 'circle_room' || shape.type === 'column_round') {
        const r = Math.min(sw, sh) / 2;
        doc.circle(sx + sw / 2, sy + sh / 2, r, 'FD');
      } else if (shape.type === 'l_room') {
        const cutW = sw * 0.5;
        const cutH = sh * 0.5;
        const pts = [
          [sx, sy],
          [sx + sw, sy],
          [sx + sw, sy + cutH],
          [sx + cutW, sy + cutH],
          [sx + cutW, sy + sh],
          [sx, sy + sh],
        ];
        // Draw polygon via lines
        for (let i = 0; i < pts.length; i++) {
          const next = pts[(i + 1) % pts.length];
          doc.line(pts[i][0], pts[i][1], next[0], next[1]);
        }
      } else if (shape.type === 'polygon' && shape.points && shape.points.length >= 3) {
        for (let i = 0; i < shape.points.length; i++) {
          const p1 = shape.points[i];
          const p2 = shape.points[(i + 1) % shape.points.length];
          const px1 = (shape.x + p1.x) * scaleFactor + offsetX;
          const py1 = (shape.y + p1.y) * scaleFactor + offsetY;
          const px2 = (shape.x + p2.x) * scaleFactor + offsetX;
          const py2 = (shape.y + p2.y) * scaleFactor + offsetY;
          doc.line(px1, py1, px2, py2);
        }
      } else if (shape.type === 'door_single') {
        // Door swing
        doc.line(sx, sy, sx + sw, sy);
        doc.line(sx, sy, sx, sy + sw);
        // Approximate arc with line
        doc.setLineDashPattern([1, 1], 0);
        doc.line(sx, sy + sw, sx + sw, sy);
        doc.setLineDashPattern([], 0);
      } else {
        doc.rect(sx, sy, sw, sh, 'D');
      }

      // Add Room Name & Area Labels inside Room
      if (shape.category === 'room' && shape.name) {
        const textX = sx + sw / 2;
        const textY = sy + sh / 2;
        const areaM2 = calculateShapeAreaM2(shape, scaleSettings.pixelsPerMeter);
        const wMeters = pxToMeters(shape.width, scaleSettings.pixelsPerMeter).toFixed(2);
        const hMeters = pxToMeters(shape.height, scaleSettings.pixelsPerMeter).toFixed(2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(shape.name.toUpperCase(), textX, textY - 2, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`${wMeters} × ${hMeters} m`, textX, textY + 2.5, { align: 'center' });
        doc.text(`Luas: ${areaM2.toFixed(2)} m²`, textX, textY + 6.5, { align: 'center' });
      }

      // Dimension numbers along edges if requested
      if (options.includeDimensions && (shape.category === 'room' || shape.type === 'wall_line')) {
        const wM = pxToMeters(shape.width, scaleSettings.pixelsPerMeter).toFixed(2);
        const hM = pxToMeters(shape.height, scaleSettings.pixelsPerMeter).toFixed(2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        // Top dimension
        doc.text(`${wM} m`, sx + sw / 2, sy - 1.5, { align: 'center' });
        // Left dimension
        doc.text(`${hM} m`, sx - 1.5, sy + sh / 2, { align: 'right' });
      }
    }
  }

  // Save the PDF
  const filename = `${projectMetadata.title.toLowerCase().replace(/\s+/g, '-') || 'denah-arsitektur'}.pdf`;
  doc.save(filename);
}
