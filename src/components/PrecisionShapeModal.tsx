import React, { useState } from 'react';
import {
  CADShape,
  Point,
  ScaleSettings,
  ShapeCategory,
  ShapeType,
} from '../types/cad';
import { unitToPx, UNIT_LABELS } from '../utils/units';
import {
  Square,
  Circle,
  Triangle,
  Hexagon,
  Boxes,
  Columns,
  Armchair,
  X,
  Sliders,
  Check,
  Sparkles,
  Lock,
  Unlock,
  Ruler,
} from 'lucide-react';

interface PrecisionShapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scaleSettings: ScaleSettings;
  spawnPosition?: Point | null;
  onAddShape: (shape: CADShape) => void;
}

type BasicShapeChoice = 'rectangle' | 'circle' | 'triangle' | 'polygon_n' | 'l_shape' | 'column' | 'furniture';

export const PrecisionShapeModal: React.FC<PrecisionShapeModalProps> = ({
  isOpen,
  onClose,
  scaleSettings,
  spawnPosition,
  onAddShape,
}) => {
  if (!isOpen) return null;

  const { unit, pixelsPerMeter } = scaleSettings;

  // Form State
  const [shapeChoice, setShapeChoice] = useState<BasicShapeChoice>('rectangle');
  const [name, setName] = useState<string>('Benda Presisi');
  const [widthM, setWidthM] = useState<number>(2.0);
  const [heightM, setHeightM] = useState<number>(1.5);
  const [radiusM, setRadiusM] = useState<number>(0.8);
  const [polygonSides, setPolygonSides] = useState<number>(6); // Hexagon default
  const [triangleType, setTriangleType] = useState<'isosceles' | 'right'>('isosceles');
  const [lThicknessM, setLThicknessM] = useState<number>(0.6); // for L-shape
  const [rotation, setRotation] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(false);
  const [fillColor, setFillColor] = useState<string>('#f1f5f9');
  const [strokeColor, setStrokeColor] = useState<string>('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);

  // Preset Colors
  const COLOR_PRESETS = [
    { label: 'Putih Arsitek', fill: '#ffffff', stroke: '#0f172a' },
    { label: 'Abu Struktur', fill: '#f1f5f9', stroke: '#334155' },
    { label: 'Biru Blueprint', fill: '#eff6ff', stroke: '#1d4ed8' },
    { label: 'Kayu Perabot', fill: '#fef3c7', stroke: '#b45309' },
    { label: 'Hijau Taman', fill: '#f0fdf4', stroke: '#15803d' },
    { label: 'Gelap Solid', fill: '#334155', stroke: '#0f172a' },
  ];

  // Calculations
  let calculatedAreaM2 = 0;
  let calculatedPerimeterM = 0;

  if (shapeChoice === 'rectangle' || shapeChoice === 'column' || shapeChoice === 'furniture') {
    calculatedAreaM2 = widthM * heightM;
    calculatedPerimeterM = 2 * (widthM + heightM);
  } else if (shapeChoice === 'circle') {
    calculatedAreaM2 = Math.PI * Math.pow(radiusM, 2);
    calculatedPerimeterM = 2 * Math.PI * radiusM;
  } else if (shapeChoice === 'triangle') {
    calculatedAreaM2 = 0.5 * widthM * heightM;
    calculatedPerimeterM = widthM + 2 * Math.hypot(widthM / 2, heightM);
  } else if (shapeChoice === 'polygon_n') {
    // Regular polygon area
    calculatedAreaM2 = 0.5 * polygonSides * Math.pow(radiusM, 2) * Math.sin((2 * Math.PI) / polygonSides);
    const sideLen = 2 * radiusM * Math.sin(Math.PI / polygonSides);
    calculatedPerimeterM = polygonSides * sideLen;
  } else if (shapeChoice === 'l_shape') {
    const t = Math.min(lThicknessM, Math.min(widthM, heightM) * 0.8);
    calculatedAreaM2 = widthM * t + (heightM - t) * t;
    calculatedPerimeterM = 2 * (widthM + heightM);
  }

  // Handle Submit
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const mToPx = (m: number) => m * pixelsPerMeter;
    const posX = spawnPosition ? spawnPosition.x : 200;
    const posY = spawnPosition ? spawnPosition.y : 180;

    let finalType: ShapeType = 'custom';
    let finalCategory: ShapeCategory = 'custom';
    let finalLayer = 'CUSTOM';
    let finalLayerId = 'layer-custom';
    let finalPoints: Point[] | undefined = undefined;
    let finalWidth = mToPx(widthM);
    let finalHeight = mToPx(heightM);

    if (shapeChoice === 'rectangle') {
      finalType = 'custom';
      finalCategory = 'custom';
    } else if (shapeChoice === 'column') {
      finalType = 'column_rect';
      finalCategory = 'opening';
      finalLayer = 'WALLS';
      finalLayerId = 'layer-walls';
    } else if (shapeChoice === 'furniture') {
      finalType = 'dining_table';
      finalCategory = 'furniture';
      finalLayer = 'FURNITURE';
      finalLayerId = 'layer-furniture';
    } else if (shapeChoice === 'circle') {
      finalType = 'circle_room';
      finalCategory = 'custom';
      finalWidth = mToPx(radiusM * 2);
      finalHeight = mToPx(radiusM * 2);
    } else if (shapeChoice === 'triangle') {
      finalType = 'polygon';
      finalCategory = 'custom';
      const w = mToPx(widthM);
      const h = mToPx(heightM);
      if (triangleType === 'right') {
        finalPoints = [
          { x: 0, y: h },
          { x: w, y: h },
          { x: 0, y: 0 },
        ];
      } else {
        finalPoints = [
          { x: w / 2, y: 0 },
          { x: w, y: h },
          { x: 0, y: h },
        ];
      }
    } else if (shapeChoice === 'polygon_n') {
      finalType = 'polygon';
      finalCategory = 'custom';
      const r = mToPx(radiusM);
      finalWidth = r * 2;
      finalHeight = r * 2;
      const pts: Point[] = [];
      for (let i = 0; i < polygonSides; i++) {
        const angle = (i * 2 * Math.PI) / polygonSides - Math.PI / 2;
        pts.push({
          x: r + r * Math.cos(angle),
          y: r + r * Math.sin(angle),
        });
      }
      finalPoints = pts;
    } else if (shapeChoice === 'l_shape') {
      finalType = 'polygon';
      finalCategory = 'custom';
      const w = mToPx(widthM);
      const h = mToPx(heightM);
      const t = mToPx(Math.min(lThicknessM, Math.min(widthM, heightM) * 0.8));
      finalPoints = [
        { x: 0, y: 0 },
        { x: t, y: 0 },
        { x: t, y: h - t },
        { x: w, y: h - t },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    }

    const newShape: CADShape = {
      id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'Benda Presisi',
      type: finalType,
      category: finalCategory,
      layer: finalLayer,
      layerId: finalLayerId,
      x: posX,
      y: posY,
      width: Math.max(15, finalWidth),
      height: Math.max(15, finalHeight),
      rotation,
      lockAspectRatio,
      fillColor,
      strokeColor,
      strokeWidth,
      points: finalPoints,
      opacity: 1,
      showDimensionLabels: true,
      zIndex: 5,
    };

    onAddShape(newShape);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bikin Shape / Benda dengan Angka Presisi</h2>
              <p className="text-xs text-slate-400">
                Pilih bentuk dasar dan masukkan ukuran pasti dalam meter (skala {scaleSettings.ratioLabel})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* 1. Pilih Bentuk Dasar */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
              1. Pilih Bentuk Dasar
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'rectangle', label: 'Persegi / Balok', icon: Square, desc: 'Panjang & Lebar' },
                { id: 'circle', label: 'Lingkaran / Tabung', icon: Circle, desc: 'Radius & Diameter' },
                { id: 'triangle', label: 'Segitiga Presisi', icon: Triangle, desc: 'Alas & Tinggi' },
                { id: 'polygon_n', label: 'Poligon N-Sisi', icon: Hexagon, desc: 'Segi 3-12 Beraturan' },
                { id: 'l_shape', label: 'Bentuk Huruf L', icon: Boxes, desc: 'Sudut Siku & Sayap' },
                { id: 'column', label: 'Pilar / Kolom', icon: Columns, desc: 'Struktur Denah' },
                { id: 'furniture', label: 'Meja / Benda Kustom', icon: Armchair, desc: 'Perabot Presisi' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = shapeChoice === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setShapeChoice(item.id as BasicShapeChoice);
                      if (item.id === 'column') setName('Kolom Struktur');
                      else if (item.id === 'furniture') setName('Meja Kustom');
                      else if (item.id === 'circle') setName('Silinder / Pilar Bulat');
                      else if (item.id === 'triangle') setName('Benda Segitiga');
                      else if (item.id === 'polygon_n') setName(`Poligon Segi-${polygonSides}`);
                      else if (item.id === 'l_shape') setName('Objek Huruf L');
                      else setName('Benda Presisi');
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs">{item.label}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Nama & Identitas Objek */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Nama Objek / Benda
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Meja Rapat, Kolom K1, Bak Taman"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Rotasi Sudut (Derajat)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="w-12 text-center font-mono font-bold bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-700">
                  {rotation}°
                </span>
              </div>
            </div>
          </div>

          {/* 3. Input Angka Presisi Sesuai Bentuk */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-blue-400" />
                Parameter Dimensi Presisi ({unit})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                1 {unit} = {pixelsPerMeter} piksel
              </span>
            </div>

            {/* A. If Rectangle, Column, Furniture, or L-Shape */}
            {(shapeChoice === 'rectangle' ||
              shapeChoice === 'column' ||
              shapeChoice === 'furniture' ||
              shapeChoice === 'l_shape' ||
              shapeChoice === 'triangle') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    {shapeChoice === 'triangle' ? 'Panjang Alas (Width)' : 'Panjang / Lebar (X)'}
                  </label>
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
                        if (lockAspectRatio) setHeightM(val);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono text-xs">{unit}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    {shapeChoice === 'triangle' ? 'Tinggi Segitiga (Height)' : 'Tinggi / Kedalaman (Y)'}
                  </label>
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
                        if (lockAspectRatio) setWidthM(val);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono text-xs">{unit}</span>
                  </div>
                </div>
              </div>
            )}

            {/* B. Specific for Circle */}
            {shapeChoice === 'circle' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Jari-Jari (Radius R)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.05"
                      max="50"
                      step="0.05"
                      value={radiusM}
                      onChange={(e) => setRadiusM(Math.max(0.05, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono text-xs">{unit}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Diameter Total (2R)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={(radiusM * 2).toFixed(2)}
                      onChange={(e) => setRadiusM(Math.max(0.05, Number(e.target.value) / 2))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono text-xs">{unit}</span>
                  </div>
                </div>
              </div>
            )}

            {/* C. Specific for Polygon N */}
            {shapeChoice === 'polygon_n' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Jumlah Sudut / Sisi (N)</label>
                  <select
                    value={polygonSides}
                    onChange={(e) => {
                      const s = Number(e.target.value);
                      setPolygonSides(s);
                      setName(`Poligon Segi-${s}`);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={3}>Segi-3 (Segitiga Sama Sisi)</option>
                    <option value={5}>Segi-5 (Pentagon)</option>
                    <option value={6}>Segi-6 (Hexagon)</option>
                    <option value={8}>Segi-8 (Octagon)</option>
                    <option value={10}>Segi-10 (Decagon)</option>
                    <option value={12}>Segi-12 (Dodecagon)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Jari-Jari Luar (Radius)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      max="50"
                      step="0.05"
                      value={radiusM}
                      onChange={(e) => setRadiusM(Math.max(0.05, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono text-xs">{unit}</span>
                  </div>
                </div>
              </div>
            )}

            {/* D. Specific for Triangle */}
            {shapeChoice === 'triangle' && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-300">Tipe Segitiga:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="triType"
                    checked={triangleType === 'isosceles'}
                    onChange={() => setTriangleType('isosceles')}
                    className="accent-blue-500"
                  />
                  <span>Sama Kaki Simetris</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="triType"
                    checked={triangleType === 'right'}
                    onChange={() => setTriangleType('right')}
                    className="accent-blue-500"
                  />
                  <span>Siku-Siku (90°)</span>
                </label>
              </div>
            )}

            {/* E. Specific for L-Shape */}
            {shapeChoice === 'l_shape' && (
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Ketebalan Sayap L</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max={Math.min(widthM, heightM) * 0.9}
                    step="0.05"
                    value={lThicknessM}
                    onChange={(e) => setLThicknessM(Math.max(0.05, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono text-xs">{unit}</span>
                </div>
              </div>
            )}

            {/* Aspect Ratio Lock for standard shapes */}
            {(shapeChoice === 'rectangle' || shapeChoice === 'column' || shapeChoice === 'furniture') && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={lockAspectRatio}
                    onChange={(e) => setLockAspectRatio(e.target.checked)}
                    className="accent-blue-500 rounded"
                  />
                  <span>Kunci Rasio Aspek (Bujur Sangkar / Proporsional)</span>
                </label>
                {lockAspectRatio ? <Lock className="w-3.5 h-3.5 text-blue-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
              </div>
            )}

            {/* Calculated Metrics live badge */}
            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg text-[11px] border border-slate-800">
              <span className="text-slate-400">Luas Otomatis:</span>
              <span className="font-mono font-bold text-emerald-400">
                {calculatedAreaM2.toFixed(2)} m²
              </span>
              <span className="text-slate-400">Keliling:</span>
              <span className="font-mono font-bold text-blue-400">
                {calculatedPerimeterM.toFixed(2)} m
              </span>
            </div>
          </div>

          {/* 4. Gaya Warna & Tampilan */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Warna & Penampilan
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COLOR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFillColor(preset.fill);
                    setStrokeColor(preset.stroke);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    fillColor === preset.fill
                      ? 'border-blue-500 bg-slate-800 ring-1 ring-blue-500'
                      : 'border-slate-700 bg-slate-950 hover:bg-slate-800'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-md border"
                    style={{ backgroundColor: preset.fill, borderColor: preset.stroke }}
                  />
                  <span className="text-[10px] text-slate-300 truncate w-full text-center">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Benda akan dibuat langsung dengan presisi skala {scaleSettings.ratioLabel}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Tambahkan ke Denah</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
