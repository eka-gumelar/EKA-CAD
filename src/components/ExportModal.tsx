import React, { useState } from 'react';
import { CADShape, ExportDXFOptions, ExportPDFOptions, ProjectMetadata, ScaleSettings } from '../types/cad';
import { exportToPDF } from '../utils/pdfExport';
import { downloadDXF } from '../utils/dxfGenerator';
import { FileDown, FileText, Compass, Layers, CheckCircle2, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shapes: CADShape[];
  scaleSettings: ScaleSettings;
  projectMetadata: ProjectMetadata;
  onUpdateMetadata: (meta: ProjectMetadata) => void;
  onExportPNG: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  shapes,
  scaleSettings,
  projectMetadata,
  onUpdateMetadata,
  onExportPNG,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'pdf' | 'cad' | 'image'>('pdf');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // PDF options
  const [pdfOptions, setPdfOptions] = useState<ExportPDFOptions>({
    paperSize: 'a4',
    orientation: 'landscape',
    includeTitleBlock: true,
    includeGrid: false,
    includeDimensions: true,
    includeScaleBar: true,
    includeNorthArrow: true,
  });

  // DXF options
  const [dxfOptions, setDxfOptions] = useState<ExportDXFOptions>({
    dxfUnit: 'mm',
    includeDimensions: true,
    includeFurniture: true,
    includeLabels: true,
  });

  // Project Metadata local state
  const [meta, setMeta] = useState<ProjectMetadata>(projectMetadata);

  const handleSaveMetadata = () => {
    onUpdateMetadata(meta);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    handleSaveMetadata();
    try {
      await exportToPDF(shapes, scaleSettings, meta, pdfOptions);
    } catch (err) {
      console.error('Export PDF error:', err);
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const handleExportCAD = () => {
    setIsExporting(true);
    handleSaveMetadata();
    try {
      const filename = `${(meta.title || 'denah-arsitektur').toLowerCase().replace(/\s+/g, '_')}.dxf`;
      downloadDXF(shapes, scaleSettings.pixelsPerMeter, dxfOptions, filename);
    } catch (err) {
      console.error('Export CAD error:', err);
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Ekspor Denah Arsitektur</h2>
              <p className="text-xs text-slate-400">Pilih format PDF gambar kerja, CAD DXF, atau Raster Image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pdf'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            Dokumen PDF (A4/A3)
          </button>
          <button
            onClick={() => setActiveTab('cad')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cad'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            AutoCAD (.DXF)
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'image'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            Gambar HD (.PNG)
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: PDF EXPORT */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              {/* Paper Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">Ukuran Kertas</label>
                  <select
                    value={pdfOptions.paperSize}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, paperSize: e.target.value as 'a4' | 'a3' })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="a4">ISO A4 (297 × 210 mm)</option>
                    <option value="a3">ISO A3 (420 × 297 mm)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">Orientasi</label>
                  <select
                    value={pdfOptions.orientation}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, orientation: e.target.value as 'landscape' | 'portrait' })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="landscape">Landscape (Memanjang)</option>
                    <option value="portrait">Portrait (Tegak)</option>
                  </select>
                </div>
              </div>

              {/* Elements to include */}
              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-2.5">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Komponen Lembar Gambar Kerja
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeTitleBlock}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, includeTitleBlock: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                  />
                  <span>Sertakan Kop Gambar Arsitektur (Title Block & Informasi Proyek)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeScaleBar}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, includeScaleBar: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                  />
                  <span>Sertakan Skala Grafis (Scale Bar Baris Hitam-Putih)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeNorthArrow}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, includeNorthArrow: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                  />
                  <span>Sertakan Kompas Arah Mata Angin (North Arrow)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeDimensions}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, includeDimensions: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                  />
                  <span>Sertakan Angka Dimensi Ukuran Dinding & Ruangan</span>
                </label>
              </div>

              {/* Title Block Metadata Form */}
              {pdfOptions.includeTitleBlock && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Data Kop Gambar (Title Block)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nama Proyek</label>
                      <input
                        type="text"
                        value={meta.projectName}
                        onChange={(e) => setMeta({ ...meta, projectName: e.target.value })}
                        placeholder="Contoh: Rumah Tinggal Modern 2 Lantai"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Judul Gambar</label>
                      <input
                        type="text"
                        value={meta.title}
                        onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                        placeholder="Denah Tata Ruang Lantai 1"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nama Arsitek / Drafter</label>
                      <input
                        type="text"
                        value={meta.architect}
                        onChange={(e) => setMeta({ ...meta, architect: e.target.value })}
                        placeholder="Arsitek Studio"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Pemilik / Klien</label>
                      <input
                        type="text"
                        value={meta.client}
                        onChange={(e) => setMeta({ ...meta, client: e.target.value })}
                        placeholder="Bapak / Ibu Klien"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAD DXF EXPORT */}
          {activeTab === 'cad' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-lg text-xs text-blue-300 leading-relaxed">
                Format <strong>AutoCAD DXF (Drawing Exchange Format)</strong> kompatibel langsung dengan AutoCAD, LibreCAD, Revit, SketchUp, ArchiCAD, dan software CAD profesional lainnya.
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Satuan Output CAD</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, dxfUnit: 'mm' })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      dxfOptions.dxfUnit === 'mm'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <div className="text-xs font-bold">Millimeter (mm) - Standar CAD</div>
                    <div className="text-[11px] text-slate-400">1 unit = 1 mm (Umum di AutoCAD Indonesia)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, dxfUnit: 'm' })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      dxfOptions.dxfUnit === 'm'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <div className="text-xs font-bold">Meter (m) - Metric</div>
                    <div className="text-[11px] text-slate-400">1 unit = 1 meter real-world</div>
                  </button>
                </div>
              </div>

              {/* Layer Selection */}
              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-2.5">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Layer CAD yang Disertakan
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 bg-slate-800"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white inline-block"></span>
                    Layer <strong>WALLS</strong> & <strong>DOORS</strong> (Dinding, Kolom, Bukaan) [Wajib]
                  </span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dxfOptions.includeFurniture}
                    onChange={(e) => setDxfOptions({ ...dxfOptions, includeFurniture: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
                    Layer <strong>FURNITURE</strong> (Perabot & Sanitair)
                  </span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dxfOptions.includeDimensions}
                    onChange={(e) => setDxfOptions({ ...dxfOptions, includeDimensions: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                    Layer <strong>DIMENSIONS</strong> (Garis Ukur Dimensi)
                  </span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dxfOptions.includeLabels}
                    onChange={(e) => setDxfOptions({ ...dxfOptions, includeLabels: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
                    Layer <strong>TEXT</strong> (Label Nama Ruangan)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: IMAGE PNG */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg text-xs text-slate-300 space-y-2">
                <p>Ekspor tangkapan layar beresolusi tinggi dalam format PNG dengan latar bersih, sangat cocok untuk presentasi klien, media sosial, atau proposal visual.</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                  <li>Resolusi canvas asli 1:1 tanpa kompresi pecah</li>
                  <li>Mencakup seluruh tata letak ruang, perabot, dan label ukuran</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs text-slate-400">
            {shapes.length} elemen denah siap diekspor
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            {activeTab === 'pdf' && (
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isExporting ? 'Memproses PDF...' : 'Unduh PDF Gambar Kerja'}
              </button>
            )}
            {activeTab === 'cad' && (
              <button
                onClick={handleExportCAD}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <Layers className="w-4 h-4" />
                {isExporting ? 'Memproses CAD...' : 'Unduh File AutoCAD (.DXF)'}
              </button>
            )}
            {activeTab === 'image' && (
              <button
                onClick={() => {
                  onExportPNG();
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
              >
                <FileDown className="w-4 h-4" />
                Unduh Gambar PNG
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
