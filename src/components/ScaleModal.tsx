import React, { useState } from 'react';
import { ScaleSettings, GridSettings, Unit } from '../types/cad';
import { Ruler, Check, X, Grid, Sliders } from 'lucide-react';

interface ScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scaleSettings: ScaleSettings;
  onSaveScale: (newScale: ScaleSettings) => void;
  gridSettings: GridSettings;
  onSaveGrid: (newGrid: GridSettings) => void;
}

export const ScaleModal: React.FC<ScaleModalProps> = ({
  isOpen,
  onClose,
  scaleSettings,
  onSaveScale,
  gridSettings,
  onSaveGrid,
}) => {
  if (!isOpen) return null;

  const [ppm, setPpm] = useState<number>(scaleSettings.pixelsPerMeter);
  const [unit, setUnit] = useState<Unit>(scaleSettings.unit);
  const [ratioLabel, setRatioLabel] = useState<string>(scaleSettings.ratioLabel);
  const [gridSize, setGridSize] = useState<number>(gridSettings.size);
  const [snapGrid, setSnapGrid] = useState<boolean>(gridSettings.snapToGrid);

  const presets = [
    { label: '1:50 (Detail Denah)', ppm: 50, ratio: '1:50', grid: 0.5 },
    { label: '1:100 (Standar Arsitektur)', ppm: 40, ratio: '1:100', grid: 1.0 },
    { label: '1:200 (Kawasan / Site Plan)', ppm: 20, ratio: '1:200', grid: 2.0 },
    { label: '1:25 (Interior Detail)', ppm: 80, ratio: '1:25', grid: 0.25 },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setPpm(p.ppm);
    setRatioLabel(p.ratio);
    setGridSize(p.grid);
  };

  const handleSave = () => {
    onSaveScale({
      pixelsPerMeter: Math.max(10, Math.min(200, ppm)),
      unit,
      ratioLabel,
    });
    onSaveGrid({
      ...gridSettings,
      size: gridSize,
      snapToGrid: snapGrid,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Kalibrasi Skala & Grid Presisi</h2>
              <p className="text-xs text-slate-400">Atur perbandingan ukuran kanvas ke dunia nyata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Preset Skala Arsitektur
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.ratio}
                  onClick={() => handleApplyPreset(p)}
                  className={`px-3 py-2 text-left rounded-lg text-xs font-medium border transition-all ${
                    ratioLabel === p.ratio
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                  }`}
                >
                  <div className="font-bold">{p.ratio}</div>
                  <div className="text-[11px] opacity-80">{p.label.split('(')[1]?.replace(')', '') || p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pixels per meter slider & input */}
          <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Piksel per 1 Meter:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={ppm}
                  onChange={(e) => setPpm(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-400">px / m</span>
              </div>
            </div>
            <input
              type="range"
              min="15"
              max="150"
              value={ppm}
              onChange={(e) => setPpm(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Lebih Ringkas (15px)</span>
              <span>Proporsional (50px)</span>
              <span>Ultra Detail (150px)</span>
            </div>
          </div>

          {/* Unit selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Satuan Pengukuran Utama
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['m', 'cm', 'mm', 'ft'] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border ${
                    unit === u
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Settings */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">Ukuran Grid Kisi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value={0.1}>0.10 m (10 cm)</option>
                  <option value={0.25}>0.25 m (25 cm)</option>
                  <option value={0.5}>0.50 m (50 cm)</option>
                  <option value={1.0}>1.00 m (100 cm)</option>
                  <option value={2.0}>2.00 m</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={snapGrid}
                onChange={(e) => setSnapGrid(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
              />
              <span>Otomatis Snap ke Grid (Rapi & Presisi)</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
          >
            <Check className="w-4 h-4" />
            Terapkan Skala
          </button>
        </div>
      </div>
    </div>
  );
};
