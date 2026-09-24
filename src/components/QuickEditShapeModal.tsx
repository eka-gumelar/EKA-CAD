import React, { useState, useEffect } from 'react';
import { CADShape, ScaleSettings } from '../types/cad';
import { pxToUnit, unitToPx } from '../utils/units';
import {
  Sliders,
  X,
  Check,
  RotateCw,
  Lock,
  Unlock,
  Ruler,
  Maximize2,
  Trash2,
  Copy,
  Layers,
} from 'lucide-react';

interface QuickEditShapeModalProps {
  isOpen: boolean;
  shape: CADShape | null;
  scaleSettings: ScaleSettings;
  onClose: () => void;
  onUpdateShape: (shape: CADShape, actionDesc?: string) => void;
  onDuplicateShape: (id: string) => void;
  onDeleteShape: (id: string) => void;
}

export const QuickEditShapeModal: React.FC<QuickEditShapeModalProps> = ({
  isOpen,
  shape,
  scaleSettings,
  onClose,
  onUpdateShape,
  onDuplicateShape,
  onDeleteShape,
}) => {
  if (!isOpen || !shape) return null;

  const { unit, pixelsPerMeter } = scaleSettings;

  // Local Form state
  const [name, setName] = useState<string>(shape.name);
  const [widthM, setWidthM] = useState<number>(pxToUnit(shape.width, pixelsPerMeter, unit));
  const [heightM, setHeightM] = useState<number>(pxToUnit(shape.height, pixelsPerMeter, unit));
  const [rotation, setRotation] = useState<number>(shape.rotation || 0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(shape.lockAspectRatio || false);
  const [fillColor, setFillColor] = useState<string>(shape.fillColor || '#ffffff');
  const [strokeColor, setStrokeColor] = useState<string>(shape.strokeColor || '#0f172a');
  const [strokeWidth, setStrokeWidth] = useState<number>(shape.strokeWidth || 2.5);

  useEffect(() => {
    if (shape) {
      setName(shape.name);
      setWidthM(Number(pxToUnit(shape.width, pixelsPerMeter, unit).toFixed(2)));
      setHeightM(Number(pxToUnit(shape.height, pixelsPerMeter, unit).toFixed(2)));
      setRotation(shape.rotation || 0);
      setLockAspectRatio(shape.lockAspectRatio || false);
      setFillColor(shape.fillColor || '#ffffff');
      setStrokeColor(shape.strokeColor || '#0f172a');
      setStrokeWidth(shape.strokeWidth || 2.5);
    }
  }, [shape, unit, pixelsPerMeter]);

  // Apply Changes
  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newWidthPx = unitToPx(widthM, unit, pixelsPerMeter);
    const newHeightPx = unitToPx(heightM, unit, pixelsPerMeter);

    // If polygon with points, rescale points proportionally
    let updatedPoints = shape.points;
    if (shape.points && shape.points.length > 0 && (newWidthPx !== shape.width || newHeightPx !== shape.height)) {
      const scaleX = newWidthPx / shape.width;
      const scaleY = newHeightPx / shape.height;
      updatedPoints = shape.points.map((pt) => ({
        x: pt.x * scaleX,
        y: pt.y * scaleY,
      }));
    }

    const updated: CADShape = {
      ...shape,
      name: name.trim() || shape.name,
      width: Math.max(10, newWidthPx),
      height: Math.max(10, newHeightPx),
      rotation: ((rotation % 360) + 360) % 360,
      lockAspectRatio,
      fillColor,
      strokeColor,
      strokeWidth,
      points: updatedPoints,
    };

    onUpdateShape(updated, `Ubah Ukuran Presisi ${updated.name}`);
    onClose();
  };

  const areaM2 = (widthM * heightM).toFixed(2);
  const perimeterM = (2 * (widthM + heightM)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Edit Ukuran Presisi</h2>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
                {shape.name} • Layer {shape.layer}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleApply} className="p-5 space-y-4 text-xs">
          {/* Name input */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Nama Objek / Ruangan</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Width and Height Inputs with real units */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-blue-400" />
                Dimensi Ukuran Presisi
              </span>
              <button
                type="button"
                onClick={() => setLockAspectRatio(!lockAspectRatio)}
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors ${
                  lockAspectRatio
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                    : 'text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
              >
                {lockAspectRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>Rasio {lockAspectRatio ? 'Terkunci' : 'Bebas'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Panjang / Lebar (X)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.05"
                    value={widthM}
                    onChange={(e) => {
                      const val = Math.max(0.05, Number(e.target.value));
                      setWidthM(val);
                      if (lockAspectRatio) {
                        const ratio = heightM / widthM || 1;
                        setHeightM(Number((val * ratio).toFixed(2)));
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono text-xs">{unit}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tinggi / Kedalaman (Y)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.05"
                    value={heightM}
                    onChange={(e) => {
                      const val = Math.max(0.05, Number(e.target.value));
                      setHeightM(val);
                      if (lockAspectRatio) {
                        const ratio = widthM / heightM || 1;
                        setWidthM(Number((val * ratio).toFixed(2)));
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono text-xs">{unit}</span>
                </div>
              </div>
            </div>

            {/* Calculated Area and Perimeter */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">Luas: <strong className="text-emerald-400 font-mono">{areaM2} m²</strong></span>
              <span className="text-slate-400">Keliling: <strong className="text-blue-400 font-mono">{perimeterM} m</strong></span>
            </div>
          </div>

          {/* Rotation control */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                Rotasi Sudut
              </label>
              <div className="flex items-center gap-1">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setRotation(deg)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                      rotation === deg
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <span className="w-12 text-center font-mono font-bold bg-slate-900 px-2 py-1 rounded border border-slate-700 text-xs">
                {rotation}°
              </span>
            </div>
          </div>

          {/* Quick Color Picker */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Warna Isi</label>
            <div className="flex items-center gap-2">
              {['#ffffff', '#f1f5f9', '#eff6ff', '#fef3c7', '#f0fdf4', '#fee2e2', '#334155'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFillColor(c)}
                  className={`w-6 h-6 rounded-md border transition-transform ${
                    fillColor === c ? 'scale-110 ring-2 ring-blue-500' : 'border-slate-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onDuplicateShape(shape.id);
                onClose();
              }}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Duplikasi Bentuk Ini"
            >
              <Copy className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteShape(shape.id);
                onClose();
              }}
              className="p-1.5 rounded-lg border border-rose-900/50 text-rose-400 hover:bg-rose-950/60 transition-colors"
              title="Hapus Bentuk Ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => handleApply()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Ukuran</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
