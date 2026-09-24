import React, { useEffect, useRef, useState } from 'react';
import { CADShape, Point, ScaleSettings } from '../types/cad';
import { pxToUnit } from '../utils/units';
import {
  Sliders,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Square,
  Circle,
  Triangle,
  Home,
  DoorOpen,
  Armchair,
  PenTool,
  LayoutTemplate,
  Layers,
  ChevronRight,
  Maximize2,
  Sparkles,
  Columns,
  Maximize,
  HelpCircle,
} from 'lucide-react';

export interface ContextMenuTarget {
  screenX: number;
  screenY: number;
  canvasPoint: Point;
  shape: CADShape | null;
}

interface ContextMenuProps {
  target: ContextMenuTarget | null;
  scaleSettings: ScaleSettings;
  onClose: () => void;
  // Shape actions
  onOpenQuickEditShape: (shape: CADShape) => void;
  onOpenInspector: () => void;
  onDuplicateShape: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onDeleteShape: (id: string) => void;
  onChangeShapeColor: (shape: CADShape, color: string) => void;
  // Canvas spawn actions
  onOpenPrecisionModal: (point: Point) => void;
  onSpawnRoom: (type: string, name: string, wM: number, hM: number, point: Point) => void;
  onSpawnBasicShape: (type: 'rect' | 'circle' | 'triangle' | 'column' | 'table' | 'door' | 'window', point: Point) => void;
  onStartDrawingPolygon: () => void;
  onOpenTemplates: () => void;
  onToggleLeftSidebar: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  target,
  scaleSettings,
  onClose,
  onOpenQuickEditShape,
  onOpenInspector,
  onDuplicateShape,
  onBringForward,
  onSendBackward,
  onDeleteShape,
  onChangeShapeColor,
  onOpenPrecisionModal,
  onSpawnRoom,
  onSpawnBasicShape,
  onStartDrawingPolygon,
  onOpenTemplates,
  onToggleLeftSidebar,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<'rooms' | 'shapes' | 'colors' | null>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!target) return null;

  const { screenX, screenY, canvasPoint, shape } = target;
  const { unit, pixelsPerMeter } = scaleSettings;

  // Calculate position so menu does not overflow window edges
  const menuWidth = 240;
  const menuHeight = shape ? 320 : 380;
  const posX = Math.min(screenX, window.innerWidth - menuWidth - 16);
  const posY = Math.min(screenY, window.innerHeight - menuHeight - 16);

  const canvasXUnit = pxToUnit(canvasPoint.x, pixelsPerMeter, unit).toFixed(2);
  const canvasYUnit = pxToUnit(canvasPoint.y, pixelsPerMeter, unit).toFixed(2);

  return (
    <div
      ref={menuRef}
      style={{ left: `${Math.max(8, posX)}px`, top: `${Math.max(8, posY)}px` }}
      className="fixed z-50 w-60 bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-2xl shadow-2xl py-1.5 text-xs text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* CASE A: RIGHT CLICK ON SHAPE / ROOM */}
      {shape ? (
        <div className="space-y-1">
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <span className="font-bold text-white text-[11px] truncate max-w-[150px]">
              {shape.name}
            </span>
            <span className="text-[10px] text-blue-400 font-mono uppercase bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
              {shape.layer}
            </span>
          </div>

          {/* Quick Edit Numeric Dimensions */}
          <button
            onClick={() => {
              onOpenQuickEditShape(shape);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
              <span className="font-semibold">Edit Ukuran Presisi...</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-blue-100 font-mono">
              {(shape.width / pixelsPerMeter).toFixed(1)}×{(shape.height / pixelsPerMeter).toFixed(1)}m
            </span>
          </button>

          {/* Open Full Inspector Panel */}
          <button
            onClick={() => {
              onOpenInspector();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Buka Panel Detail (Kanan)</span>
          </button>

          {/* Duplicate */}
          <button
            onClick={() => {
              onDuplicateShape(shape.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Duplikasi Elemen</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Ctrl+D</span>
          </button>

          {/* Quick Color Picker Submenu */}
          <div
            className="relative"
            onMouseEnter={() => setActiveSubmenu('colors')}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            <button className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded border border-slate-600"
                  style={{ backgroundColor: shape.fillColor || '#ffffff' }}
                />
                <span>Ubah Warna...</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>

            {activeSubmenu === 'colors' && (
              <div className="absolute left-full top-0 ml-1 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 grid grid-cols-3 gap-1.5">
                {[
                  { name: 'Putih', color: '#ffffff' },
                  { name: 'Abu-abu', color: '#f1f5f9' },
                  { name: 'Biru', color: '#eff6ff' },
                  { name: 'Krem Kayu', color: '#fef3c7' },
                  { name: 'Hijau', color: '#f0fdf4' },
                  { name: 'Gelap', color: '#334155' },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => {
                      onChangeShapeColor(shape, c.color);
                      onClose();
                    }}
                    className="w-8 h-8 rounded-lg border border-slate-700 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 my-1" />

          {/* Stacking Order */}
          <button
            onClick={() => {
              onBringForward(shape.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
            <span>Bawa ke Depan</span>
          </button>
          <button
            onClick={() => {
              onSendBackward(shape.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Kirim ke Belakang</span>
          </button>

          <div className="border-t border-slate-800 my-1" />

          {/* Delete */}
          <button
            onClick={() => {
              onDeleteShape(shape.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-rose-600 hover:text-white text-rose-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Elemen</span>
            </div>
            <span className="text-[10px] text-rose-300 font-mono">Del</span>
          </button>
        </div>
      ) : (
        /* CASE B: RIGHT CLICK ON EMPTY CANVAS (ADD / CREATE ANY SHAPE AT CLICKED POINT) */
        <div className="space-y-1">
          {/* Header with Coordinates */}
          <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Tambah ke Denah
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              X:{canvasXUnit} Y:{canvasYUnit} {unit}
            </span>
          </div>

          {/* Primary Action: Bikin Shape / Benda dengan Angka Presisi */}
          <button
            onClick={() => {
              onOpenPrecisionModal(canvasPoint);
              onClose();
            }}
            className="w-full px-3 py-2 text-left flex items-center justify-between bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-semibold transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400 group-hover:text-white" />
              <span>Bikin Shape Presisi...</span>
            </div>
            <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1 rounded">Angka</span>
          </button>

          {/* Submenu: Tambah Ruangan Cepat */}
          <div
            className="relative"
            onMouseEnter={() => setActiveSubmenu('rooms')}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            <button className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
              <div className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Tambah Ruangan</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>

            {activeSubmenu === 'rooms' && (
              <div className="absolute left-full top-0 ml-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                  Pilih Tipe Ruangan
                </div>
                {[
                  { name: 'Ruang Tamu Utama', w: 4.0, h: 5.0, type: 'rect_room' },
                  { name: 'Kamar Tidur Utama', w: 3.5, h: 4.0, type: 'rect_room' },
                  { name: 'Kamar Tidur Anak', w: 3.0, h: 3.0, type: 'rect_room' },
                  { name: 'Dapur Bersih', w: 3.0, h: 2.5, type: 'rect_room' },
                  { name: 'Kamar Mandi / WC', w: 2.0, h: 1.8, type: 'rect_room' },
                  { name: 'Ruang Kantor / Kerja', w: 4.0, h: 4.0, type: 'rect_room' },
                ].map((r) => (
                  <button
                    key={r.name}
                    onClick={() => {
                      onSpawnRoom(r.type, r.name, r.w, r.h, canvasPoint);
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <span>{r.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {r.w}×{r.h}m
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submenu: Bentuk Dasar & Perabot Cepat */}
          <div
            className="relative"
            onMouseEnter={() => setActiveSubmenu('shapes')}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            <button className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
              <div className="flex items-center gap-2">
                <Square className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Bentuk Dasar & Objek</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>

            {activeSubmenu === 'shapes' && (
              <div className="absolute left-full top-0 ml-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                  Bentuk Dasar Presisi
                </div>
                {[
                  { id: 'rect', label: 'Persegi Balok', icon: Square, dim: '2×1.5m' },
                  { id: 'circle', label: 'Lingkaran / Tabung', icon: Circle, dim: 'Ø 1.6m' },
                  { id: 'triangle', label: 'Segitiga Presisi', icon: Triangle, dim: '1.5×1.5m' },
                  { id: 'column', label: 'Kolom Struktur', icon: Columns, dim: '0.3×0.3m' },
                  { id: 'table', label: 'Meja Kerja', icon: Armchair, dim: '1.4×0.7m' },
                  { id: 'door', label: 'Pintu Swing', icon: DoorOpen, dim: '0.9m' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSpawnBasicShape(item.id as any, canvasPoint);
                        onClose();
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 text-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.dim}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 my-1" />

          {/* Bikin Poligon Bebas */}
          <button
            onClick={() => {
              onStartDrawingPolygon();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <PenTool className="w-3.5 h-3.5 text-purple-400" />
              <span>Gambar Poligon Bebas</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">P</span>
          </button>

          {/* Toggle Left Sidebar */}
          <button
            onClick={() => {
              onToggleLeftSidebar();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Buka/Tutup Menu Kiri</span>
          </button>

          {/* Templates */}
          <button
            onClick={() => {
              onOpenTemplates();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 text-amber-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
              <span>Pustaka Template</span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-mono">T</span>
          </button>
        </div>
      )}
    </div>
  );
};
