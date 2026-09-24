import React, { useState } from 'react';
import { Unit, ScaleSettings } from '../types/cad';
import { unitToPx, UNIT_LABELS } from '../utils/units';
import {
  Ruler,
  Square,
  Sparkles,
  LayoutTemplate,
  PenTool,
  Check,
  Building2,
  Maximize2,
  ChevronRight,
} from 'lucide-react';

interface InitialRoomCardProps {
  scaleSettings: ScaleSettings;
  onCreateBaseRoom: (params: {
    name: string;
    widthUnit: number;
    heightUnit: number;
    roomShape: 'rect_room' | 'l_room';
    wallThicknessUnit: number;
  }) => void;
  onOpenTemplates?: () => void;
  onStartDrawingPolygon?: () => void;
  onDismiss?: () => void;
}

export const InitialRoomCard: React.FC<InitialRoomCardProps> = ({
  scaleSettings,
  onCreateBaseRoom,
  onOpenTemplates,
  onStartDrawingPolygon,
  onDismiss,
}) => {
  const { unit, pixelsPerMeter } = scaleSettings;

  // Default values based on unit
  const defaultW = unit === 'cm' ? 500 : unit === 'mm' ? 5000 : unit === 'ft' ? 16 : 5.0;
  const defaultH = unit === 'cm' ? 400 : unit === 'mm' ? 4000 : unit === 'ft' ? 13 : 4.0;
  const defaultWall = unit === 'cm' ? 15 : unit === 'mm' ? 150 : unit === 'ft' ? 0.5 : 0.15;

  const [roomName, setRoomName] = useState<string>('Ruang Tamu Utama');
  const [widthVal, setWidthVal] = useState<number>(defaultW);
  const [heightVal, setHeightVal] = useState<number>(defaultH);
  const [roomShape, setRoomShape] = useState<'rect_room' | 'l_room'>('rect_room');
  const [wallThicknessVal, setWallThicknessVal] = useState<number>(defaultWall);

  const unitLabel = UNIT_LABELS[unit];

  // Room presets based on meters
  const presets = [
    { label: '3 × 3 m', desc: 'Kamar Standar', w: 3, h: 3, name: 'Kamar Tidur 1' },
    { label: '4 × 5 m', desc: 'Kamar Utama', w: 4, h: 5, name: 'Kamar Tidur Utama' },
    { label: '6 × 4 m', desc: 'Ruang Tamu', w: 6, h: 4, name: 'Ruang Tamu' },
    { label: '8 × 6 m', desc: 'Denah Dasar', w: 8, h: 6, name: 'Ruang Utama Terbuka' },
    { label: '100 × 100 m', desc: 'Lahan / Gudang Besar', w: 100, h: 100, name: 'Lahan / Area Luas 100m' },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    let multiplier = 1;
    if (unit === 'cm') multiplier = 100;
    else if (unit === 'mm') multiplier = 1000;
    else if (unit === 'ft') multiplier = 3.28084;

    setWidthVal(Number((p.w * multiplier).toFixed(2)));
    setHeightVal(Number((p.h * multiplier).toFixed(2)));
    setRoomName(p.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (widthVal <= 0 || heightVal <= 0) return;
    onCreateBaseRoom({
      name: roomName || 'Ruangan Dasar',
      widthUnit: widthVal,
      heightUnit: heightVal,
      roomShape,
      wallThicknessUnit: wallThicknessVal,
    });
  };

  // Quick delta adjustments
  const adjustWidth = (delta: number) => {
    setWidthVal((prev) => Math.max(0.5, Number((prev + delta).toFixed(2))));
  };

  const adjustHeight = (delta: number) => {
    setHeightVal((prev) => Math.max(0.5, Number((prev + delta).toFixed(2))));
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 z-20 pointer-events-none">
      <div className="bg-slate-900/95 border border-slate-700/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 max-w-lg w-full pointer-events-auto text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Mulai Ruangan Dasar</span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-mono">
                  Presisi Skala {scaleSettings.ratioLabel}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Masukkan ukuran presisi untuk ruangan pertama Anda di kanvas.
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              title="Tutup dan mulai kanvas kosong"
            >
              Lewati
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Room Name & Shape Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Nama Ruangan
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Contoh: Ruang Tamu / Kamar Utama"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Bentuk Dasar
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoomShape('rect_room')}
                  className={`py-1 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
                    roomShape === 'rect_room'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Square className="w-3 h-3" />
                  <span>Persegi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoomShape('l_room')}
                  className={`py-1 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
                    roomShape === 'l_room'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold">L</span>
                  <span>Bentuk L</span>
                </button>
              </div>
            </div>
          </div>

          {/* Precision Dimensions (Width & Height) with Quick Adjust Buttons */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            {/* Panjang / Lebar X */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Panjang (X)
                </label>
                <span className="text-[10px] text-blue-400 font-mono font-bold">
                  {unitLabel}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustWidth(-0.5)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-sm flex items-center justify-center shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  value={widthVal}
                  onChange={(e) => setWidthVal(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => adjustWidth(0.5)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-sm flex items-center justify-center shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* Lebar / Tinggi Y */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Lebar (Y)
                </label>
                <span className="text-[10px] text-blue-400 font-mono font-bold">
                  {unitLabel}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustHeight(-0.5)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-sm flex items-center justify-center shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  value={heightVal}
                  onChange={(e) => setHeightVal(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => adjustHeight(0.5)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-sm flex items-center justify-center shrink-0"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets for fast architecture prototyping */}
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Pilihan Ukuran Standar Arsitektur:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-800 hover:border-blue-500/50 border border-slate-700/80 rounded-lg text-left transition-all text-xs group"
                >
                  <div className="font-mono font-bold text-white group-hover:text-blue-300 text-[11px]">
                    {p.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Create Button */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>+ Buat Ruangan & Mulai Menggambar</span>
          </button>
        </form>

        {/* Secondary Options (Templates & Freeform) */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">Atau pilih opsi lain:</span>
          <div className="flex items-center gap-2">
            {onOpenTemplates && (
              <button
                onClick={onOpenTemplates}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Template Denah</span>
              </button>
            )}
            <span className="text-slate-600">•</span>
            {onStartDrawingPolygon && (
              <button
                onClick={onStartDrawingPolygon}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Gambar Bebas</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
