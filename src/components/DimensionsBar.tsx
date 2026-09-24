import React from 'react';
import { ScaleSettings, CADShape, Unit } from '../types/cad';
import { calculateShapeAreaM2, formatArea, formatDistance, UNIT_LABELS } from '../utils/units';
import { Compass, Maximize2, Layers } from 'lucide-react';

interface DimensionsBarProps {
  cursorPos: { x: number; y: number } | null;
  scaleSettings: ScaleSettings;
  shapes: CADShape[];
  zoom: number;
}

export const DimensionsBar: React.FC<DimensionsBarProps> = ({
  cursorPos,
  scaleSettings,
  shapes,
  zoom,
}) => {
  const { unit, pixelsPerMeter } = scaleSettings;

  // Real world cursor coords
  const cursorXM = cursorPos ? (cursorPos.x / pixelsPerMeter).toFixed(2) : '0.00';
  const cursorYM = cursorPos ? (cursorPos.y / pixelsPerMeter).toFixed(2) : '0.00';

  // Calculate total room area
  const totalRoomAreaM2 = shapes
    .filter((s) => s.category === 'room')
    .reduce((sum, s) => sum + calculateShapeAreaM2(s, pixelsPerMeter), 0);

  // Scale bar width for 2 meters on canvas
  const scaleBar2mMeters = 2;
  const scaleBarWidthPx = scaleBar2mMeters * pixelsPerMeter * zoom;

  return (
    <footer className="h-8 bg-slate-950 border-t border-slate-800 text-slate-400 px-4 flex items-center justify-between text-[11px] font-mono select-none shrink-0 z-20">
      {/* Left: Cursor coordinates and status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Compass className="w-3.5 h-3.5 text-blue-400" />
          <span>
            X: <strong className="text-white">{cursorXM}</strong> {UNIT_LABELS[unit]}
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Y: <strong className="text-white">{cursorYM}</strong> {UNIT_LABELS[unit]}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>{shapes.length} Objek Denah</span>
        </div>
      </div>

      {/* Center: Total floor area summary */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 hidden md:inline">Total Luas Ruangan:</span>
        <span className="px-2 py-0.5 bg-blue-950/80 border border-blue-800/60 rounded text-emerald-400 font-bold">
          {formatArea(totalRoomAreaM2, unit)}
        </span>
      </div>

      {/* Right: Graphic Scale Bar in footer */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-500">
          <span>Skala: {scaleSettings.ratioLabel}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative flex flex-col items-center">
            <div
              className="h-1.5 bg-slate-300 border-x-2 border-slate-100"
              style={{ width: `${Math.min(100, Math.max(25, scaleBarWidthPx))}px` }}
            />
            <span className="text-[9px] text-slate-400 leading-none mt-0.5">2 {UNIT_LABELS[unit]}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
