import React, { useState, useRef, useEffect } from 'react';
import { MouseSensitivitySettings } from '../types/cad';
import {
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  RotateCcw,
  Maximize2,
  X,
  Sparkles,
  MousePointer,
  Check,
} from 'lucide-react';

interface ZoomControlWidgetProps {
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetZoom: () => void;
  onFitView?: () => void;
  sensitivitySettings: MouseSensitivitySettings;
  onUpdateSensitivity: (newSettings: MouseSensitivitySettings) => void;
}

export const ZoomControlWidget: React.FC<ZoomControlWidgetProps> = ({
  zoom,
  onZoomChange,
  onResetZoom,
  onFitView,
  sensitivitySettings,
  onUpdateSensitivity,
}) => {
  const [showSensitivityPopover, setShowSensitivityPopover] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowSensitivityPopover(false);
      }
    };

    if (showSensitivityPopover) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showSensitivityPopover]);

  const handleZoomSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valPercent = parseFloat(e.target.value);
    onZoomChange(Math.max(0.04, Math.min(5.0, valPercent / 100)));
  };

  const handleStepZoom = (delta: number) => {
    const step = zoom < 0.2 ? (delta > 0 ? 0.02 : -0.02) : delta;
    const next = Math.max(0.04, Math.min(5.0, Number((zoom + step).toFixed(2))));
    onZoomChange(next);
  };

  const handleResetSensitivity = () => {
    onUpdateSensitivity({
      panSensitivity: 1.0,
      zoomSensitivity: 1.0,
      invertWheelZoom: false,
      autoWallJoin: true,
      showSmartGuides: true,
      autoAvoidDimensionLabels: true,
    });
  };

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end select-none pointer-events-auto">
      {/* Mouse Sensitivity Settings Popover */}
      {showSensitivityPopover && (
        <div
          ref={popoverRef}
          className="mb-2 w-72 bg-slate-900/95 border border-slate-700/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-white">Sensitivitas & Navigasi Mouse</h4>
            </div>
            <button
              onClick={() => setShowSensitivityPopover(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* 1. Pan Drag Sensitivity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-300 font-medium">Sensitivitas Geser (Pan):</span>
                <span className="font-mono text-blue-400 font-bold text-[11px]">
                  {sensitivitySettings.panSensitivity.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.1"
                value={sensitivitySettings.panSensitivity}
                onChange={(e) =>
                  onUpdateSensitivity({
                    ...sensitivitySettings,
                    panSensitivity: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                <span>Halus (0.3x)</span>
                <span>Normal (1.0x)</span>
                <span>Cepat (2.5x)</span>
              </div>
            </div>

            {/* 2. Zoom Sensitivity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-300 font-medium">Sensitivitas Scroll Zoom:</span>
                <span className="font-mono text-blue-400 font-bold text-[11px]">
                  {sensitivitySettings.zoomSensitivity.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.1"
                value={sensitivitySettings.zoomSensitivity}
                onChange={(e) =>
                  onUpdateSensitivity({
                    ...sensitivitySettings,
                    zoomSensitivity: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                <span>Lembut (0.3x)</span>
                <span>Normal (1.0x)</span>
                <span>Responsif (2.5x)</span>
              </div>
            </div>

            {/* 3. Invert Scroll Zoom Direction */}
            <label className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition-colors">
              <span className="text-[11px] text-slate-300">Balik Arah Scroll Zoom</span>
              <input
                type="checkbox"
                checked={sensitivitySettings.invertWheelZoom}
                onChange={(e) =>
                  onUpdateSensitivity({
                    ...sensitivitySettings,
                    invertWheelZoom: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
              />
            </label>

            {/* 4. Auto Wall-Join Toggle */}
            <label className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition-colors">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-300 font-medium">Sambung Dinding Otomatis</span>
                <span className="text-[9px] text-slate-500">Wall-join saat dinding diletakkan dekat</span>
              </div>
              <input
                type="checkbox"
                checked={sensitivitySettings.autoWallJoin}
                onChange={(e) =>
                  onUpdateSensitivity({
                    ...sensitivitySettings,
                    autoWallJoin: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
              />
            </label>

            {/* 5. Smart Guides Toggle */}
            <label className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition-colors">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-300 font-medium">Garis Panduan Pintar (Smart Guides)</span>
                <span className="text-[9px] text-slate-500">Garis putus-putus penyelarasan presisi</span>
              </div>
              <input
                type="checkbox"
                checked={sensitivitySettings.showSmartGuides}
                onChange={(e) =>
                  onUpdateSensitivity({
                    ...sensitivitySettings,
                    showSmartGuides: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
              />
            </label>

            {/* 6. Smart Anti-Overlap Labels Toggle */}
            <label className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition-colors">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-300 font-medium">Label Dimensi Anti-Tabrakan</span>
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    Otomatis
                  </span>
                </div>
                <span className="text-[9px] text-slate-500">Posisi teks & dimensi bergeser dinamis agar tidak tumpang tindih</span>
              </div>
              <input
                type="checkbox"
                checked={sensitivitySettings.autoAvoidDimensionLabels ?? true}
                onChange={(e) =>
                  onUpdateSensitivity({
                    ...sensitivitySettings,
                    autoAvoidDimensionLabels: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
              />
            </label>

            {/* Reset to Default Button */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetSensitivity}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke Default</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSensitivityPopover(false)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-colors"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Zoom & Mouse Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-2xl shadow-xl text-slate-200">
        {/* Mouse Sensitivity Button */}
        <button
          onClick={() => setShowSensitivityPopover(!showSensitivityPopover)}
          className={`p-2 rounded-xl border transition-all ${
            showSensitivityPopover
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
          }`}
          title="Pengaturan Sensitivitas Mouse & Navigasi"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-800" />

        {/* Zoom Out Button */}
        <button
          onClick={() => handleStepZoom(-0.1)}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Perkecil Zoom (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom Range Slider */}
        <div className="flex items-center px-1.5 w-24 sm:w-28">
          <input
            type="range"
            min="5"
            max="500"
            step="5"
            value={zoomPercent}
            onChange={handleZoomSliderChange}
            className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            title={`Tingkat Zoom: ${zoomPercent}%`}
          />
        </div>

        {/* Zoom In Button */}
        <button
          onClick={() => handleStepZoom(0.1)}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Perbesar Zoom (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Percentage Label / Reset to 100% */}
        <button
          onClick={onResetZoom}
          className="px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 font-mono text-xs font-bold transition-colors min-w-[50px] text-center"
          title="Klik untuk reset zoom ke 100% (Ctrl+0)"
        >
          {zoomPercent}%
        </button>

        {/* Fit to View Button */}
        {onFitView && (
          <button
            onClick={onFitView}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Pusatkan Tampilan Denah (F)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
