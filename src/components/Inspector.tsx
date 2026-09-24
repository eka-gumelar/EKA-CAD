import React, { useState } from 'react';
import { CADShape, ScaleSettings, Unit, CADLayer, LayerItem } from '../types/cad';
import {
  calculateShapeAreaM2,
  calculateShapePerimeterM,
  formatArea,
  formatDistance,
  pxToUnit,
  unitToPx,
  UNIT_LABELS,
} from '../utils/units';
import {
  Lock,
  Unlock,
  RotateCw,
  Copy,
  Trash2,
  Layers,
  Sparkles,
  ArrowRight,
  Maximize2,
  Tag,
  Palette,
  Eye,
  Sliders,
  ShieldAlert,
  PanelRightClose,
  ChevronRight,
} from 'lucide-react';

interface InspectorProps {
  selectedShape: CADShape | null;
  scaleSettings: ScaleSettings;
  layers: LayerItem[];
  onUpdateShape: (updated: CADShape, actionDesc?: string) => void;
  onDeleteShape: (id: string) => void;
  onDuplicateShape: (id: string, offsetXm?: number, offsetYm?: number) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onClose?: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedShape,
  scaleSettings,
  layers,
  onUpdateShape,
  onDeleteShape,
  onDuplicateShape,
  onBringForward,
  onSendBackward,
  onClose,
}) => {
  const [duplicateOffsetX, setDuplicateOffsetX] = useState<number>(1.0);
  const [duplicateOffsetY, setDuplicateOffsetY] = useState<number>(0.0);

  if (!selectedShape) {
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full select-none">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Panel Detail
            </span>
            <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
              W
            </kbd>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Sembunyikan Menu Detail (W)"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 p-5 flex flex-col items-center justify-center text-center text-slate-400">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-3">
            <Sliders className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Panel Presisi Arsitektur</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
            Pilih salah satu elemen di kanvas untuk menyesuaikan ukuran angka, rasio aspek, koordinat jarak, dan kalkulasi otomatis.
          </p>
        </div>
      </div>
    );
  }

  const { unit, pixelsPerMeter } = scaleSettings;

  // Real-world values in current unit
  const widthInUnit = pxToUnit(selectedShape.width, pixelsPerMeter, unit);
  const heightInUnit = pxToUnit(selectedShape.height, pixelsPerMeter, unit);
  const xInUnit = pxToUnit(selectedShape.x, pixelsPerMeter, unit);
  const yInUnit = pxToUnit(selectedShape.y, pixelsPerMeter, unit);

  // Real-world calculations
  const areaM2 = calculateShapeAreaM2(selectedShape, pixelsPerMeter);
  const perimeterM = calculateShapePerimeterM(selectedShape, pixelsPerMeter);

  // Aspect ratio calculation
  const currentRatio = (selectedShape.width / (selectedShape.height || 1)).toFixed(2);

  // Handlers for dimension inputs
  const handleWidthChange = (newValUnit: number) => {
    if (isNaN(newValUnit) || newValUnit <= 0) return;
    const newWidthPx = unitToPx(newValUnit, unit, pixelsPerMeter);

    if (selectedShape.lockAspectRatio && selectedShape.width > 0) {
      const ratio = selectedShape.height / selectedShape.width;
      const newHeightPx = newWidthPx * ratio;
      onUpdateShape({
        ...selectedShape,
        width: Math.max(5, newWidthPx),
        height: Math.max(5, newHeightPx),
      });
    } else {
      onUpdateShape({
        ...selectedShape,
        width: Math.max(5, newWidthPx),
      });
    }
  };

  const handleHeightChange = (newValUnit: number) => {
    if (isNaN(newValUnit) || newValUnit <= 0) return;
    const newHeightPx = unitToPx(newValUnit, unit, pixelsPerMeter);

    if (selectedShape.lockAspectRatio && selectedShape.height > 0) {
      const ratio = selectedShape.width / selectedShape.height;
      const newWidthPx = newHeightPx * ratio;
      onUpdateShape({
        ...selectedShape,
        width: Math.max(5, newWidthPx),
        height: Math.max(5, newHeightPx),
      });
    } else {
      onUpdateShape({
        ...selectedShape,
        height: Math.max(5, newHeightPx),
      });
    }
  };

  const handleXChange = (newValUnit: number) => {
    if (isNaN(newValUnit)) return;
    const newXPx = unitToPx(newValUnit, unit, pixelsPerMeter);
    onUpdateShape({
      ...selectedShape,
      x: newXPx,
    });
  };

  const handleYChange = (newValUnit: number) => {
    if (isNaN(newValUnit)) return;
    const newYPx = unitToPx(newValUnit, unit, pixelsPerMeter);
    onUpdateShape({
      ...selectedShape,
      y: newYPx,
    });
  };

  const handleSetPresetRatio = (ratioW: number, ratioH: number) => {
    const targetRatio = ratioW / ratioH;
    const currentArea = selectedShape.width * selectedShape.height;
    const newWidth = Math.sqrt(currentArea * targetRatio);
    const newHeight = newWidth / targetRatio;

    onUpdateShape({
      ...selectedShape,
      width: Math.max(10, newWidth),
      height: Math.max(10, newHeight),
      lockAspectRatio: true,
    });
  };

  const handleRotate90 = () => {
    const nextRot = (selectedShape.rotation + 90) % 360;
    onUpdateShape({
      ...selectedShape,
      rotation: nextRot,
    });
  };

  const handleCustomDuplicate = () => {
    onDuplicateShape(selectedShape.id, duplicateOffsetX, duplicateOffsetY);
  };

  const hatchPatterns = [
    { id: 'none', label: 'Polos' },
    { id: 'tile', label: 'Keramik' },
    { id: 'wood', label: 'Kayu Parquet' },
    { id: 'diagonal', label: 'Arsir Dinding' },
    { id: 'grid', label: 'Grid' },
  ];

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
          <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
            {selectedShape.name || 'Elemen Terpilih'}
          </span>
          <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700 shrink-0">
            W
          </kbd>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onDuplicateShape(selectedShape.id, 0.5, 0.5)}
            title="Duplikasi (Ctrl+D)"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteShape(selectedShape.id)}
            title="Hapus Elemen (Del)"
            className="p-1 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Sembunyikan Menu Detail (W)"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1 border-l border-slate-700/60 pl-1.5"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Automatic Calculation Card */}
        <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Kalkulasi Otomatis Skala
            </span>
            <span className="text-[10px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded font-mono">
              {scaleSettings.ratioLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Luas Permukaan</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                {formatArea(areaM2, unit)}
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Keliling / Dinding</div>
              <div className="text-sm font-bold text-blue-300 font-mono mt-0.5">
                {perimeterM.toFixed(2)} m
              </div>
            </div>
          </div>
        </div>

        {/* Name & Layer */}
        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Nama / Label Ruang</label>
            <input
              type="text"
              value={selectedShape.name}
              onChange={(e) => onUpdateShape({ ...selectedShape, name: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Tetapkan ke Layer CAD</label>
            <select
              value={selectedShape.layerId || selectedShape.layer}
              onChange={(e) => {
                const targetLayer = layers.find((l) => l.id === e.target.value || l.cadLayerName === e.target.value);
                onUpdateShape({
                  ...selectedShape,
                  layerId: targetLayer ? targetLayer.id : e.target.value,
                  layer: targetLayer ? targetLayer.cadLayerName : (e.target.value as CADLayer),
                }, `Pindahkan ${selectedShape.name} ke Layer ${targetLayer?.name || e.target.value}`);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {layers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.cadLayerName})
                </option>
              ))}
            </select>
          </div>

          {/* Locked layer alert */}
          {(() => {
            const currentLayer = layers.find(
              (l) => l.id === selectedShape.layerId || l.cadLayerName === selectedShape.layer
            );
            if (currentLayer?.locked) {
              return (
                <div className="flex items-center gap-1.5 p-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-300 text-[11px]">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Layer ini terkunci. Buka kunci pada panel Layer untuk mengedit posisi di kanvas.</span>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Precision Dimensions Input */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Ukuran Presisi ({UNIT_LABELS[unit]})
            </span>
            {/* Aspect ratio toggle */}
            <button
              onClick={() => onUpdateShape({ ...selectedShape, lockAspectRatio: !selectedShape.lockAspectRatio })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                selectedShape.lockAspectRatio
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
              title="Kunci Rasio Aspek (Ukuran berubah proporsional)"
            >
              {selectedShape.lockAspectRatio ? (
                <>
                  <Lock className="w-3 h-3 text-blue-400" /> Rasio Dikunci ({currentRatio})
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" /> Rasio Bebas
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Lebar (W)</span>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="number"
                  step="0.05"
                  value={Number(widthInUnit.toFixed(2))}
                  onChange={(e) => handleWidthChange(parseFloat(e.target.value))}
                  className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono ml-1">{UNIT_LABELS[unit]}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Panjang / Tinggi (H)</span>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="number"
                  step="0.05"
                  value={Number(heightInUnit.toFixed(2))}
                  onChange={(e) => handleHeightChange(parseFloat(e.target.value))}
                  className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono ml-1">{UNIT_LABELS[unit]}</span>
              </div>
            </div>
          </div>

          {/* Quick Aspect Ratio Presets */}
          <div>
            <div className="text-[10px] text-slate-400 mb-1.5">Preset Rasio Aspek Cepat:</div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleSetPresetRatio(1, 1)}
                className="py-1 px-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-[10px] font-mono border border-slate-700 text-center"
              >
                1 : 1
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetRatio(4, 3)}
                className="py-1 px-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-[10px] font-mono border border-slate-700 text-center"
              >
                4 : 3
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetRatio(16, 9)}
                className="py-1 px-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-[10px] font-mono border border-slate-700 text-center"
              >
                16 : 9
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetRatio(1, 2)}
                className="py-1 px-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-[10px] font-mono border border-slate-700 text-center"
              >
                1 : 2
              </button>
            </div>
          </div>
        </div>

        {/* Position & Orientation */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Posisi & Sudut Rotasi
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Koordinat X</span>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="number"
                  step="0.1"
                  value={Number(xInUnit.toFixed(2))}
                  onChange={(e) => handleXChange(parseFloat(e.target.value))}
                  className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono ml-1">{UNIT_LABELS[unit]}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Koordinat Y</span>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="number"
                  step="0.1"
                  value={Number(yInUnit.toFixed(2))}
                  onChange={(e) => handleYChange(parseFloat(e.target.value))}
                  className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono ml-1">{UNIT_LABELS[unit]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 block mb-1">Sudut Rotasi (°)</span>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="number"
                  min="0"
                  max="360"
                  step="5"
                  value={Math.round(selectedShape.rotation || 0)}
                  onChange={(e) => onUpdateShape({ ...selectedShape, rotation: (parseInt(e.target.value) || 0) % 360 })}
                  className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono ml-1">deg</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleRotate90}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors text-xs font-medium"
                title="Putar 90 Derajat Searah Jarum Jam"
              >
                <RotateCw className="w-3.5 h-3.5" />
                +90°
              </button>
            </div>
          </div>
        </div>

        {/* Specific Distance Duplication / Precision Offset */}
        <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2.5">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Duplikasi dengan Jarak Spesifik
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Geser ΔX (m)</span>
              <input
                type="number"
                step="0.5"
                value={duplicateOffsetX}
                onChange={(e) => setDuplicateOffsetX(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Geser ΔY (m)</span>
              <input
                type="number"
                step="0.5"
                value={duplicateOffsetY}
                onChange={(e) => setDuplicateOffsetY(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCustomDuplicate}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-lg text-xs font-medium transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplikat dengan Jarak Ini
          </button>
        </div>

        {/* Styling: Fill, Stroke, Hatch */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Gaya Tampilan & Arsir
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Warna Isi</span>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="color"
                  value={selectedShape.fillColor || '#ffffff'}
                  onChange={(e) => onUpdateShape({ ...selectedShape, fillColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[10px] font-mono text-slate-300 uppercase">
                  {selectedShape.fillColor || '#ffffff'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Warna Garis</span>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="color"
                  value={selectedShape.strokeColor || '#0f172a'}
                  onChange={(e) => onUpdateShape({ ...selectedShape, strokeColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[10px] font-mono text-slate-300 uppercase">
                  {selectedShape.strokeColor || '#0f172a'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Pola Arsir Lantai (Hatch)</span>
            <select
              value={selectedShape.hatchPattern || 'none'}
              onChange={(e) => onUpdateShape({ ...selectedShape, hatchPattern: e.target.value as any })}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {hatchPatterns.map((hp) => (
                <option key={hp.id} value={hp.id}>
                  {hp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dimension toggle */}
          <div className="space-y-1.5 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedShape.showDimensionLabels ?? true}
                onChange={(e) => onUpdateShape({ ...selectedShape, showDimensionLabels: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
              />
              <span>Tampilkan Angka Ukuran pada Shape</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedShape.autoAvoidLabels ?? true}
                onChange={(e) => onUpdateShape({ ...selectedShape, autoAvoidLabels: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
              />
              <span className="flex items-center gap-1.5">
                <span>Penataan Label Anti-Tabrakan</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  Cerdas
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Layer Ordering */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Urutan Tumpukan:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onBringForward(selectedShape.id)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[11px]"
            >
              Ke Depan
            </button>
            <button
              onClick={() => onSendBackward(selectedShape.id)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[11px]"
            >
              Ke Belakang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
