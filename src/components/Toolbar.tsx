import React, { useState, useRef, useEffect } from 'react';
import { Unit, ScaleSettings, GridSettings, ProjectMetadata } from '../types/cad';
import {
  MousePointer,
  PenTool,
  Grid,
  Magnet,
  Ruler,
  Undo2,
  Redo2,
  FileDown,
  Layers,
  FolderOpen,
  Save,
  HelpCircle,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutTemplate,
  ChevronDown,
  MoreHorizontal,
  Hand,
  Sparkles,
} from 'lucide-react';

export type CanvasTheme = 'light' | 'blueprint' | 'darkcad';

interface ToolbarProps {
  projectMetadata: ProjectMetadata;
  onUpdateMetadata: (meta: ProjectMetadata) => void;
  scaleSettings: ScaleSettings;
  gridSettings: GridSettings;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onOpenScaleModal: () => void;
  onOpenExportModal: () => void;
  onOpenTemplateModal: () => void;
  onOpenGuideModal: () => void;
  isLayerPanelOpen: boolean;
  onToggleLayerPanel: () => void;
  isLibraryOpen?: boolean;
  onToggleLibrary?: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  activeLayerCount: number;
  activeTool: 'select' | 'polygon' | 'pan';
  onChangeTool: (tool: 'select' | 'polygon' | 'pan') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  undoActionDescription?: string;
  redoActionDescription?: string;
  historyList?: { description: string; timestamp: number }[];
  currentHistoryIndex?: number;
  onJumpToHistory?: (index: number) => void;
  canvasTheme: CanvasTheme;
  onChangeTheme: (theme: CanvasTheme) => void;
  onSaveJSON: () => void;
  onLoadJSON: () => void;
  autoWallJoinActive?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  projectMetadata,
  onUpdateMetadata,
  scaleSettings,
  gridSettings,
  onToggleGrid,
  onToggleSnap,
  onOpenScaleModal,
  onOpenExportModal,
  onOpenTemplateModal,
  onOpenGuideModal,
  isLayerPanelOpen,
  onToggleLayerPanel,
  isLibraryOpen = true,
  onToggleLibrary,
  isInspectorOpen,
  onToggleInspector,
  activeLayerCount,
  activeTool,
  onChangeTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  undoActionDescription,
  redoActionDescription,
  historyList = [],
  currentHistoryIndex = 0,
  onJumpToHistory,
  canvasTheme,
  onChangeTheme,
  onSaveJSON,
  onLoadJSON,
  autoWallJoinActive = true,
}) => {
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  return (
    <header className="h-13 bg-slate-900 border-b border-slate-800 text-slate-200 px-3 sm:px-4 flex items-center justify-between gap-2 select-none shrink-0 z-30">
      {/* 1. Left: Brand & Project Name & Quick Wall-Join Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Ruler className="w-4 h-4 rotate-45" />
          </div>
          <div>
            <div className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
              <span>ArchiPlan</span>
              <span className="text-[9px] px-1 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded font-mono font-medium">
                {scaleSettings.ratioLabel}
              </span>
            </div>
            <input
              type="text"
              value={projectMetadata.title}
              onChange={(e) => onUpdateMetadata({ ...projectMetadata, title: e.target.value })}
              className="text-xs font-medium text-slate-300 bg-transparent border-0 border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none px-0.5 py-0 max-w-[110px] sm:max-w-[140px] truncate"
              title="Klik untuk mengubah nama proyek"
            />
          </div>
        </div>

        {/* Auto Wall-Join Active Pill */}
        {autoWallJoinActive && (
          <div
            className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400"
            title="Penyambungan dinding (wall-join) otomatis aktif saat objek didekatkan"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>Wall-Join Aktif</span>
          </div>
        )}
      </div>

      {/* 2. Center: Clean Primary Tools & History */}
      <div className="flex items-center gap-2">
        {/* Tool Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onChangeTool('select')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Mode Seleksi / Pindah & Ubah Ukuran (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pilih</span>
          </button>

          <button
            onClick={() => onChangeTool('polygon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'polygon'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Gambar Poligon Bebas (P)"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gambar Bebas</span>
          </button>

          <button
            onClick={() => onChangeTool('pan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'pan'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Geser Kanvas (H atau Tahan Spasi)"
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Geser</span>
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 transition-colors"
            title={`Undo (Ctrl+Z)${undoActionDescription ? `: ${undoActionDescription}` : ''}`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 transition-colors"
            title={`Redo (Ctrl+Y)${redoActionDescription ? `: ${redoActionDescription}` : ''}`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {historyList.length > 0 && onJumpToHistory && (
            <div className="relative">
              <button
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                title="Riwayat Langkah"
              >
                <ChevronDown className="w-3 h-3" />
              </button>

              {showHistoryDropdown && (
                <div
                  className="absolute left-0 top-full mt-2 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs"
                  onMouseLeave={() => setShowHistoryDropdown(false)}
                >
                  <div className="px-3 py-1 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    Riwayat Perubahan ({currentHistoryIndex + 1}/{historyList.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {historyList.map((entry, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onJumpToHistory(idx);
                          setShowHistoryDropdown(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs truncate transition-colors ${
                          idx === currentHistoryIndex
                            ? 'bg-blue-600/30 text-white font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {entry.description}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Right: View Toggles, More Options & Primary Export */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Grid & Snap Compact Group */}
        <div className="hidden sm:flex items-center bg-slate-950/70 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={onToggleGrid}
            className={`p-1.5 rounded-lg transition-colors ${
              gridSettings.enabled
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={gridSettings.enabled ? 'Sembunyikan Grid (G)' : 'Tampilkan Grid (G)'}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleSnap}
            className={`p-1.5 rounded-lg transition-colors ${
              gridSettings.snapToGrid
                ? 'bg-emerald-600/20 text-emerald-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={gridSettings.snapToGrid ? 'Snap ke Grid: Aktif (M)' : 'Snap ke Grid: Nonaktif (M)'}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Layers Toggle Button */}
        <button
          onClick={onToggleLayerPanel}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isLayerPanelOpen
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
          }`}
          title="Panel Layer CAD (L)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Layer</span>
        </button>

        {/* Toggle Left Shape Library Button */}
        {onToggleLibrary && (
          <button
            onClick={onToggleLibrary}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isLibraryOpen
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
            }`}
            title={isLibraryOpen ? 'Sembunyikan Menu Bentuk (Q)' : 'Buka Menu Bentuk (Q)'}
          >
            {isLibraryOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5 text-blue-400" />}
            <span className="hidden xl:inline">Menu Bentuk</span>
            <kbd className="hidden xl:inline-block text-[9px] px-1.5 py-0.2 rounded bg-black/30 text-blue-200 border border-white/10 font-mono">
              Q
            </kbd>
          </button>
        )}

        {/* Toggle Right Inspector Detail Panel Button */}
        <button
          onClick={onToggleInspector}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isInspectorOpen
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
          }`}
          title={isInspectorOpen ? 'Sembunyikan Menu Detail (W)' : 'Buka Menu Detail Ukuran (W)'}
        >
          {isInspectorOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5 text-blue-400" />}
          <span className="hidden lg:inline">Detail Ukuran</span>
          <kbd className="hidden lg:inline-block text-[9px] px-1.5 py-0.2 rounded bg-black/30 text-blue-200 border border-white/10 font-mono">
            W
          </kbd>
        </button>

        {/* Clean More Menu Dropdown (Templates, Scale, Themes, Save/Load, Guide) */}
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              showMoreMenu
                ? 'bg-slate-800 text-white border-slate-600'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
            }`}
            title="Menu Tambahan (Template, Skala, Simpan, Panduan)"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="space-y-1">
                {/* Template Catalog */}
                <button
                  onClick={() => {
                    onOpenTemplateModal();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <LayoutTemplate className="w-4 h-4 text-amber-400" />
                  <span>Katalog Template Denah</span>
                </button>

                {/* Scale & Calibration */}
                <button
                  onClick={() => {
                    onOpenScaleModal();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <Ruler className="w-4 h-4 text-blue-400" />
                  <span>Atur Skala ({scaleSettings.ratioLabel})</span>
                </button>

                {/* Guide & Tips */}
                <button
                  onClick={() => {
                    onOpenGuideModal();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>Panduan & Tips Arsitektur</span>
                </button>

                <div className="h-[1px] bg-slate-800 my-1" />

                {/* Theme Switcher */}
                <div className="px-2.5 py-1 text-[10px] text-slate-500 font-bold uppercase">
                  Tema Gambar:
                </div>
                <div className="grid grid-cols-3 gap-1 px-1">
                  <button
                    onClick={() => onChangeTheme('light')}
                    className={`py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      canvasTheme === 'light'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Kertas
                  </button>
                  <button
                    onClick={() => onChangeTheme('blueprint')}
                    className={`py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      canvasTheme === 'blueprint'
                        ? 'bg-blue-900 text-blue-200 font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Blueprint
                  </button>
                  <button
                    onClick={() => onChangeTheme('darkcad')}
                    className={`py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      canvasTheme === 'darkcad'
                        ? 'bg-slate-800 text-amber-300 font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    CAD Dark
                  </button>
                </div>

                <div className="h-[1px] bg-slate-800 my-1" />

                {/* Save & Load JSON */}
                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  <button
                    onClick={() => {
                      onSaveJSON();
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-[11px] transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-400" />
                    <span>Simpan</span>
                  </button>
                  <button
                    onClick={() => {
                      onLoadJSON();
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-[11px] transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Buka File</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Export Button */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all active:scale-[0.98]"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ekspor Denah</span>
          <span className="sm:hidden">Ekspor</span>
        </button>
      </div>
    </header>
  );
};
