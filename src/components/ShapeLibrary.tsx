import React, { useState } from 'react';
import { ShapeCategory, ShapeType, CADShape, ScaleSettings } from '../types/cad';
import { unitToPx, UNIT_LABELS } from '../utils/units';
import {
  Square,
  Maximize2,
  Circle,
  Triangle,
  Boxes,
  PenTool,
  DoorOpen,
  Columns,
  Armchair,
  Ruler,
  Plus,
  Home,
  Sliders,
  ChevronDown,
  Layers,
  Sparkles,
  PanelLeftClose,
  X,
} from 'lucide-react';

interface ShapeLibraryProps {
  scaleSettings: ScaleSettings;
  onAddShape: (shape: CADShape) => void;
  isDrawingPolygon: boolean;
  onStartDrawingPolygon: () => void;
  onCancelDrawingPolygon: () => void;
  activeCategory: ShapeCategory | 'templates';
  onSelectCategory: (cat: ShapeCategory | 'templates') => void;
  onLoadTemplate: (type: 'house' | 'studio' | 'empty') => void;
  onClose?: () => void;
  onOpenPrecisionModal?: () => void;
}

export const ShapeLibrary: React.FC<ShapeLibraryProps> = ({
  scaleSettings,
  onAddShape,
  isDrawingPolygon,
  onStartDrawingPolygon,
  onCancelDrawingPolygon,
  activeCategory,
  onSelectCategory,
  onLoadTemplate,
  onClose,
  onOpenPrecisionModal,
}) => {
  const { unit, pixelsPerMeter } = scaleSettings;

  // Custom Quick Dimension inputs
  const [quickWidth, setQuickWidth] = useState<number>(4.0);
  const [quickHeight, setQuickHeight] = useState<number>(3.5);
  const [quickName, setQuickName] = useState<string>('Ruang Baru');

  const m = (meters: number) => meters * pixelsPerMeter;

  // Helper to generate new shape
  const createShape = (type: ShapeType, name: string, wM: number, hM: number, extra: Partial<CADShape> = {}): CADShape => {
    return {
      id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      type,
      category: extra.category || 'room',
      layer: extra.layer || 'WALLS',
      x: 200,
      y: 180,
      width: m(wM),
      height: m(hM),
      rotation: 0,
      lockAspectRatio: extra.lockAspectRatio ?? false,
      fillColor: extra.fillColor || '#f8fafc',
      strokeColor: extra.strokeColor || '#0f172a',
      strokeWidth: extra.strokeWidth || 2.5,
      opacity: extra.opacity ?? 1,
      hatchPattern: extra.hatchPattern || 'none',
      showDimensionLabels: extra.showDimensionLabels ?? true,
      zIndex: extra.zIndex || 5,
      ...extra,
    };
  };

  // Add custom regular polygon
  const handleAddRegularPolygon = (sides: number, name: string) => {
    const radius = m(1.8);
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      points.push({
        x: radius + radius * Math.cos(angle),
        y: radius + radius * Math.sin(angle),
      });
    }

    const shape = createShape('polygon', name, 3.6, 3.6, {
      category: 'custom',
      layer: 'CUSTOM',
      points,
      fillColor: '#f1f5f9',
      strokeColor: '#0f172a',
      strokeWidth: 2.5,
      lockAspectRatio: true,
    });
    onAddShape(shape);
  };

  const handleAddTriangle = (type: 'isosceles' | 'right', name: string) => {
    const w = m(1.5);
    const h = m(1.5);
    const points =
      type === 'right'
        ? [
            { x: 0, y: h },
            { x: w, y: h },
            { x: 0, y: 0 },
          ]
        : [
            { x: w / 2, y: 0 },
            { x: w, y: h },
            { x: 0, y: h },
          ];

    const shape = createShape('polygon', name, 1.5, 1.5, {
      category: 'custom',
      layer: 'CUSTOM',
      points,
      fillColor: '#f1f5f9',
      strokeColor: '#0f172a',
      strokeWidth: 2.5,
    });
    onAddShape(shape);
  };

  const handleAddLShape = (name: string) => {
    const w = m(2.5);
    const h = m(2.5);
    const t = m(0.8);
    const points = [
      { x: 0, y: 0 },
      { x: t, y: 0 },
      { x: t, y: h - t },
      { x: w, y: h - t },
      { x: w, y: h },
      { x: 0, y: h },
    ];
    const shape = createShape('polygon', name, 2.5, 2.5, {
      category: 'custom',
      layer: 'CUSTOM',
      points,
      fillColor: '#f1f5f9',
      strokeColor: '#0f172a',
      strokeWidth: 2.5,
    });
    onAddShape(shape);
  };

  const handleAddQuickCustomRoom = () => {
    const widthPx = unitToPx(quickWidth, unit, pixelsPerMeter);
    const heightPx = unitToPx(quickHeight, unit, pixelsPerMeter);

    const shape: CADShape = {
      id: `room-${Date.now()}`,
      name: quickName || 'Ruang Presisi',
      type: 'rect_room',
      category: 'room',
      layer: 'WALLS',
      x: 220,
      y: 180,
      width: Math.max(20, widthPx),
      height: Math.max(20, heightPx),
      rotation: 0,
      lockAspectRatio: false,
      fillColor: '#f8fafc',
      strokeColor: '#0f172a',
      strokeWidth: 2.5,
      opacity: 1,
      showDimensionLabels: true,
      zIndex: 2,
    };
    onAddShape(shape);
  };

  const categories = [
    { id: 'room', label: 'Ruangan', icon: Home },
    { id: 'custom', label: 'Bikin Shape', icon: PenTool },
    { id: 'opening', label: 'Bukaan & Struktur', icon: DoorOpen },
    { id: 'furniture', label: 'Perabot Denah', icon: Armchair },
    { id: 'dimension', label: 'Garis Ukur', icon: Ruler },
    { id: 'templates', label: 'Template Denah', icon: Layers },
  ];

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-full overflow-hidden select-none">
      {/* Sidebar Header with Slide-Out / Close Button */}
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Square className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">Pustaka Bentuk</span>
          <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
            Q
          </kbd>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
            title="Sembunyikan Menu Bentuk (Q)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Header */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/60 overflow-x-auto no-scrollbar flex gap-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id as any)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Library List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* CATEGORY: ROOMS */}
        {activeCategory === 'room' && (
          <div className="space-y-4">
            {/* Quick Precision Input Card */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                Tambah Ruang dengan Angka Presisi
              </span>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Nama Ruangan</label>
                  <input
                    type="text"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="Contoh: Kamar Tidur"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Lebar ({UNIT_LABELS[unit]})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={quickWidth}
                      onChange={(e) => setQuickWidth(parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Panjang ({UNIT_LABELS[unit]})</label>
                    <input
                      type="number"
                      step="0.1"
                      value={quickHeight}
                      onChange={(e) => setQuickHeight(parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddQuickCustomRoom}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Tambahkan ke Denah
                </button>

                {onOpenPrecisionModal && (
                  <button
                    type="button"
                    onClick={onOpenPrecisionModal}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-blue-300 border border-slate-700 rounded-lg text-xs font-medium transition-all"
                  >
                    <Sliders className="w-3 h-3 text-blue-400" />
                    Buka Dialog Input Presisi Lengkap...
                  </button>
                )}
              </div>
            </div>

            {/* Preset Rooms */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Bentuk Ruangan Standar
              </span>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => onAddShape(createShape('rect_room', 'Ruang Tamu', 4.0, 3.5, { category: 'room', fillColor: '#f1f5f9' }))}
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                      <Square className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                        Ruang Persegi
                      </div>
                      <div className="text-[11px] text-slate-400">4.0 × 3.5 m (14.0 m²)</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                </button>

                <button
                  onClick={() => onAddShape(createShape('l_room', 'Ruang Bentuk L', 4.5, 4.0, { category: 'room', fillColor: '#f8fafc' }))}
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 font-bold text-xs">
                      L
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                        Ruang Bentuk L
                      </div>
                      <div className="text-[11px] text-slate-400">Cocok untuk Dapur / Foyer</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                </button>

                <button
                  onClick={() => onAddShape(createShape('t_room', 'Ruang Bentuk T', 5.0, 4.0, { category: 'room', fillColor: '#f8fafc' }))}
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 font-bold text-xs">
                      T
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">
                        Ruang Bentuk T
                      </div>
                      <div className="text-[11px] text-slate-400">Koridor / Ruang Terbuka</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                </button>

                <button
                  onClick={() => onAddShape(createShape('circle_room', 'Gazebo / Ruang Bundar', 3.0, 3.0, { category: 'room', fillColor: '#f1f5f9', lockAspectRatio: true }))}
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                      <Circle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-purple-400 transition-colors">
                        Ruang Bundar
                      </div>
                      <div className="text-[11px] text-slate-400">Diameter 3.0 m (7.07 m²)</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY: CUSTOM SHAPE / BIKIN SHAPE SENDIRI */}
        {activeCategory === 'custom' && (
          <div className="space-y-4">
            {/* Modal Trigger for Precision Input */}
            {onOpenPrecisionModal && (
              <div className="p-3 bg-gradient-to-br from-blue-950/70 to-slate-900 border border-blue-600/40 rounded-xl space-y-2 shadow-lg">
                <div className="flex items-center gap-2 text-blue-300">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold">Bikin Benda Angka Presisi</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Pilih bentuk dasar (kotak, lingkaran, segitiga, poligon, huruf L, meja, kolom) & masukkan ukuran pasti dalam meter.
                </p>
                <button
                  type="button"
                  onClick={onOpenPrecisionModal}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/25 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Buka Form Benda Presisi...</span>
                </button>
              </div>
            )}

            {/* Quick Basic Precision Shapes */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Bentuk Dasar Siap Pakai
              </span>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() =>
                    onAddShape(
                      createShape('custom', 'Persegi Presisi 1x1m', 1.0, 1.0, {
                        category: 'custom',
                        layer: 'CUSTOM',
                        lockAspectRatio: true,
                        fillColor: '#ffffff',
                      })
                    )
                  }
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                      <Square className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-blue-400">
                        Persegi Kotak Presisi
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">1.0 × 1.0 m (1.0 m²)</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                </button>

                <button
                  onClick={() =>
                    onAddShape(
                      createShape('custom', 'Persegi Panjang 2x1.5m', 2.0, 1.5, {
                        category: 'custom',
                        layer: 'CUSTOM',
                        fillColor: '#f1f5f9',
                      })
                    )
                  }
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Square className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-400">
                        Persegi Panjang Balok
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">2.0 × 1.5 m (3.0 m²)</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                </button>

                <button
                  onClick={() =>
                    onAddShape(
                      createShape('circle_room', 'Silinder Bulat Ø1.2m', 1.2, 1.2, {
                        category: 'custom',
                        layer: 'CUSTOM',
                        lockAspectRatio: true,
                        fillColor: '#eff6ff',
                      })
                    )
                  }
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                      <Circle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-400">
                        Silinder / Lingkaran
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Diameter 1.2 m</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                </button>

                <button
                  onClick={() => handleAddTriangle('isosceles', 'Segitiga Presisi (Sama Kaki)')}
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <Triangle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-amber-400">
                        Segitiga Presisi Sama Kaki
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Alas 1.5m, Tinggi 1.5m</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                </button>

                <button
                  onClick={() => handleAddTriangle('right', 'Segitiga Siku-Siku 90°')}
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <Triangle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-amber-400">
                        Segitiga Siku-Siku 90°
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">1.5 × 1.5 m (Sudut Siku)</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                </button>

                <button
                  onClick={() => handleAddLShape('Bentuk Huruf L Presisi')}
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                      <Boxes className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-purple-400">
                        Bentuk Huruf L Presisi
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">2.5 × 2.5 m (Tebal 0.8m)</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                </button>
              </div>
            </div>

            {/* Custom Polygons Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Poligon Beraturan N-Sisi
              </span>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleAddRegularPolygon(5, 'Segi-5 (Pentagon)')}
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-blue-400">
                    Bentuk Segi Lima (Pentagon)
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                </button>

                <button
                  onClick={() => handleAddRegularPolygon(6, 'Segi-6 (Hexagon)')}
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-blue-400">
                    Bentuk Segi Enam (Hexagon)
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                </button>

                <button
                  onClick={() => handleAddRegularPolygon(8, 'Segi-8 (Octagon)')}
                  className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
                >
                  <div className="text-xs font-semibold text-white group-hover:text-blue-400">
                    Bentuk Segi Delapan (Octagon)
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                </button>
              </div>
            </div>

            {/* Freeform Polygon Tool */}
            <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-blue-300">
                <PenTool className="w-4 h-4" />
                <span className="text-xs font-bold">Gambar Poligon Bebas</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Klik pada kanvas untuk membuat titik sudut bentuk poligon sendiri. Tekan Selesai untuk menutup bentuk.
              </p>

              {!isDrawingPolygon ? (
                <button
                  onClick={onStartDrawingPolygon}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 rounded-lg text-xs font-semibold transition-all"
                >
                  <PenTool className="w-4 h-4 text-emerald-400" />
                  Mulai Gambar Poligon Bebas
                </button>
              ) : (
                <button
                  onClick={onCancelDrawingPolygon}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Batalkan Menggambar
                </button>
              )}
            </div>
          </div>
        )}

        {/* CATEGORY: OPENINGS & STRUCTURE */}
        {activeCategory === 'opening' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pintu, Jendela & Kolom CAD
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onAddShape(createShape('door_single', 'Pintu Swing 90cm', 0.9, 0.9, { category: 'opening', layer: 'DOORS', lockAspectRatio: true, strokeColor: '#dc2626', zIndex: 12 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-red-400">Pintu Tunggal 90 cm</div>
                  <div className="text-[11px] text-slate-400">Dengan busur swing 90°</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
              </button>

              <button
                onClick={() => onAddShape(createShape('door_double', 'Pintu Kupu Tarung 160cm', 1.6, 0.8, { category: 'opening', layer: 'DOORS', strokeColor: '#dc2626', zIndex: 12 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-red-400">Pintu Ganda (Double)</div>
                  <div className="text-[11px] text-slate-400">Lebar 1.6 m</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
              </button>

              <button
                onClick={() => onAddShape(createShape('door_sliding', 'Pintu Geser (Sliding)', 1.5, 0.15, { category: 'opening', layer: 'DOORS', strokeColor: '#dc2626', zIndex: 12 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-red-400">Pintu Geser (Sliding)</div>
                  <div className="text-[11px] text-slate-400">Lebar 1.5 m</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
              </button>

              <button
                onClick={() => onAddShape(createShape('window_double', 'Jendela Kaca 2 Daun', 1.2, 0.15, { category: 'opening', layer: 'WINDOWS', strokeColor: '#0284c7', fillColor: '#bae6fd', zIndex: 12 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-cyan-400">Jendela Kaca 2 Panel</div>
                  <div className="text-[11px] text-slate-400">Lebar 1.2 m</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
              </button>

              <button
                onClick={() => onAddShape(createShape('column_rect', 'Kolom Praktis 15x15', 0.15, 0.15, { category: 'column', layer: 'WALLS', lockAspectRatio: true, fillColor: '#0f172a', zIndex: 20 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white">Kolom Struktur 15×15 cm</div>
                  <div className="text-[11px] text-slate-400">Bata praktis / beton bertulang</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onAddShape(createShape('column_round', 'Kolom Bundar Ø30cm', 0.3, 0.3, { category: 'column', layer: 'WALLS', lockAspectRatio: true, fillColor: '#1e293b', zIndex: 20 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white">Kolom Bulat Ø30 cm</div>
                  <div className="text-[11px] text-slate-400">Pilar teras arsitektur</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onAddShape(createShape('wall_line', 'Dinding Bata 3m', 3.0, 0.15, { category: 'wall', layer: 'WALLS', fillColor: '#334155', strokeWidth: 1.5, zIndex: 6 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white">Dinding Bata Tebal 15cm</div>
                  <div className="text-[11px] text-slate-400">Panjang 3.0 m (dapat disesuaikan)</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}

        {/* CATEGORY: FURNITURE */}
        {activeCategory === 'furniture' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Simbol Perabot & Sanitair
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onAddShape(createShape('bed_double', 'King Bed 180×200', 1.8, 2.0, { category: 'furniture', layer: 'FURNITURE', lockAspectRatio: true, fillColor: '#f1f5f9', strokeColor: '#64748b', zIndex: 8 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-blue-400">Tempat Tidur King Bed</div>
                  <div className="text-[11px] text-slate-400">1.8 × 2.0 m</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onAddShape(createShape('sofa_3seat', 'Sofa 3 Dudukan', 2.1, 0.85, { category: 'furniture', layer: 'FURNITURE', fillColor: '#e2e8f0', strokeColor: '#475569', zIndex: 8 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-blue-400">Sofa 3 Dudukan</div>
                  <div className="text-[11px] text-slate-400">2.1 × 0.85 m</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onAddShape(createShape('dining_table', 'Meja Makan 6 Kursi', 1.6, 0.9, { category: 'furniture', layer: 'FURNITURE', fillColor: '#f8fafc', strokeColor: '#475569', zIndex: 8 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-blue-400">Meja Makan 6 Kursi</div>
                  <div className="text-[11px] text-slate-400">1.6 × 0.9 m</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onAddShape(createShape('kitchen_counter', 'Meja Dapur & Sink', 2.4, 0.6, { category: 'furniture', layer: 'FURNITURE', fillColor: '#fef3c7', strokeColor: '#b45309', zIndex: 8 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-400">Kitchen Set Dapur</div>
                  <div className="text-[11px] text-slate-400">2.4 × 0.6 m</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onAddShape(createShape('bathroom_toilet', 'Toilet Duduk / WC', 0.5, 0.7, { category: 'furniture', layer: 'FURNITURE', lockAspectRatio: true, fillColor: '#ffffff', strokeColor: '#0284c7', zIndex: 8 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-cyan-400">Toilet Kloset Duduk</div>
                  <div className="text-[11px] text-slate-400">0.5 × 0.7 m</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}

        {/* CATEGORY: DIMENSION & ANNOTATION */}
        {activeCategory === 'dimension' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Garis Ukur & Anotasi CAD
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onAddShape(createShape('dimension_line', 'Garis Ukur 3.5m', 3.5, 0.3, { category: 'dimension', layer: 'DIMENSIONS', strokeColor: '#16a34a', strokeWidth: 1.5, zIndex: 25 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-emerald-400">Garis Dimensi Horizontal</div>
                  <div className="text-[11px] text-slate-400">Panah ukuran otomatis</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
              </button>

              <button
                onClick={() => onAddShape(createShape('text_note', 'Catatan Teknis', 2.0, 0.8, { category: 'text', layer: 'TEXT', textContent: 'Ketinggian Elevasi ±0.00', fillColor: 'transparent', strokeColor: '#eab308', strokeWidth: 1, zIndex: 30 }))}
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-yellow-400">Catatan Teks / Elevasi</div>
                  <div className="text-[11px] text-slate-400">Anotasi spesifikasi arsitektur</div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-yellow-400" />
              </button>
            </div>
          </div>
        )}

        {/* CATEGORY: TEMPLATES */}
        {activeCategory === 'templates' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pilihan Contoh Denah
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-white">Denah Rumah Tipe 45 Modern</div>
                <p className="text-[11px] text-slate-400">
                  Lengkap dengan R. Tamu, Kamar Tidur Utama, Kamar Anak, Dapur, KM/WC, dan Teras.
                </p>
                <button
                  onClick={() => onLoadTemplate('house')}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                >
                  Muat Denah Rumah
                </button>
              </div>

              <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-white">Denah Studio Apartemen (24 m²)</div>
                <p className="text-[11px] text-slate-400">
                  Layout optimal studio 6×4m dengan kamar mandi, kitchenette, tempat tidur, dan balkon.
                </p>
                <button
                  onClick={() => onLoadTemplate('studio')}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                >
                  Muat Denah Studio
                </button>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-slate-300">Mulai dari Kanvas Bersih</div>
                <p className="text-[11px] text-slate-400">
                  Hapus semua objek dan mulai mendesain denah baru dari nol.
                </p>
                <button
                  onClick={() => onLoadTemplate('empty')}
                  className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-colors"
                >
                  Kanvas Kosong
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
