import React, { useState } from 'react';
import { CADShape, ExportDXFOptions, ExportPDFOptions, GridSettings, LayerItem, ProjectMetadata, ScaleSettings } from '../types/cad';
import { exportToPDF } from '../utils/pdfExport';
import { downloadDXF, generateDXF } from '../utils/dxfGenerator';
import {
  FileDown,
  FileText,
  Compass,
  Layers,
  CheckCircle2,
  X,
  GitBranch,
  Github,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Terminal,
  CloudUpload,
  Eye,
  EyeOff,
  RotateCw,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shapes: CADShape[];
  scaleSettings: ScaleSettings;
  gridSettings?: GridSettings;
  layers?: LayerItem[];
  projectMetadata: ProjectMetadata;
  onUpdateMetadata: (meta: ProjectMetadata) => void;
  onExportPNG: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  shapes,
  scaleSettings,
  gridSettings,
  layers,
  projectMetadata,
  onUpdateMetadata,
  onExportPNG,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'pdf' | 'cad' | 'image' | 'github'>('pdf');
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

  // GitHub Sync state
  const [ghRepo, setGhRepo] = useState<string>(() => localStorage.getItem('archiplan_gh_repo') || 'eka-gumelar/EKA-CAD');
  const [ghToken, setGhToken] = useState<string>(() => localStorage.getItem('archiplan_gh_token') || '');
  const [ghBranch, setGhBranch] = useState<string>(() => localStorage.getItem('archiplan_gh_branch') || 'main');
  const [syncDXF, setSyncDXF] = useState<boolean>(true);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{
    type: 'success' | 'error';
    message: string;
    url?: string;
    commitSha?: string;
  } | null>(null);

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

  // Direct GitHub Push via GitHub REST API
  const handleSyncToGitHub = async () => {
    if (!ghRepo.trim()) {
      setSyncResult({
        type: 'error',
        message: 'Masukkan nama repositori target (contoh: username/nama-repo)',
      });
      return;
    }

    if (!ghToken.trim()) {
      setSyncResult({
        type: 'error',
        message: 'Masukkan GitHub Personal Access Token (PAT) untuk otentikasi push file.',
      });
      return;
    }

    const cleanRepo = ghRepo.trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\.git$/i, '')
      .replace(/\/$/, '');

    const parts = cleanRepo.split('/');
    if (parts.length < 2) {
      setSyncResult({
        type: 'error',
        message: 'Format repositori harus "owner/nama-repo" (contoh: john/denah-rumah)',
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    // Save configuration in localStorage for convenience
    localStorage.setItem('archiplan_gh_repo', cleanRepo);
    localStorage.setItem('archiplan_gh_token', ghToken);
    localStorage.setItem('archiplan_gh_branch', ghBranch);

    try {
      const titleSlug = (meta.title || 'denah-arsitektur').toLowerCase().replace(/\s+/g, '_');
      const jsonFileName = `designs/${titleSlug}.archiplan.json`;

      const projectData = {
        version: '1.2',
        metadata: meta,
        scaleSettings,
        gridSettings,
        layers,
        shapes,
        syncedAt: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(projectData, null, 2);
      // UTF-8 safe base64 encoding
      const jsonBase64 = btoa(unescape(encodeURIComponent(jsonString)));

      // 1. Check if file already exists on GitHub to obtain sha for update
      let existingSha: string | undefined;
      const getFileRes = await fetch(
        `https://api.github.com/repos/${cleanRepo}/contents/${jsonFileName}?ref=${ghBranch}`,
        {
          headers: {
            Authorization: `Bearer ${ghToken.trim()}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (getFileRes.ok) {
        const fileInfo = await getFileRes.json();
        existingSha = fileInfo.sha;
      }

      // 2. Put file to GitHub
      const putBody: any = {
        message: `sync: update floor plan "${meta.title || 'design'}" from ArchiPlan Studio`,
        content: jsonBase64,
        branch: ghBranch,
      };
      if (existingSha) putBody.sha = existingSha;

      const putRes = await fetch(
        `https://api.github.com/repos/${cleanRepo}/contents/${jsonFileName}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${ghToken.trim()}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(putBody),
        }
      );

      if (!putRes.ok) {
        const errJson = await putRes.json().catch(() => ({}));
        if (putRes.status === 401) {
          throw new Error('Token GitHub tidak valid atau kedaluwarsa. Pastikan token memiliki scope "repo" (Read and Write).');
        }
        if (putRes.status === 404) {
          throw new Error(`Repositori "${cleanRepo}" tidak ditemukan atau Token tidak memiliki akses ke repositori ini. Pastikan repositori sudah dibuat di GitHub dan nama repositori benar (format: username/repo).`);
        }
        if (putRes.status === 409) {
          throw new Error('Repositori GitHub masih kosong atau branch belum dibuat. Lakukan push source code pertama kali via Terminal/Git atau inisialisasi dengan README di GitHub.');
        }
        throw new Error(errJson.message || `Gagal sync (Status HTTP ${putRes.status})`);
      }

      const putData = await putRes.json();
      const commitSha = putData.commit?.sha?.substring(0, 7) || 'OK';
      const fileUrl = putData.content?.html_url || `https://github.com/${cleanRepo}/blob/${ghBranch}/${jsonFileName}`;

      // 3. Optional: Sync AutoCAD DXF file as well
      if (syncDXF) {
        const dxfFileName = `designs/${titleSlug}.dxf`;
        const dxfContent = generateDXF(shapes, scaleSettings.pixelsPerMeter, dxfOptions);
        const dxfBase64 = btoa(unescape(encodeURIComponent(dxfContent)));

        let existingDxfSha: string | undefined;
        const getDxfRes = await fetch(
          `https://api.github.com/repos/${cleanRepo}/contents/${dxfFileName}?ref=${ghBranch}`,
          {
            headers: {
              Authorization: `Bearer ${ghToken.trim()}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        if (getDxfRes.ok) {
          const dxfInfo = await getDxfRes.json();
          existingDxfSha = dxfInfo.sha;
        }

        const putDxfBody: any = {
          message: `sync: update CAD DXF for "${meta.title || 'design'}" from ArchiPlan Studio`,
          content: dxfBase64,
          branch: ghBranch,
        };
        if (existingDxfSha) putDxfBody.sha = existingDxfSha;

        await fetch(`https://api.github.com/repos/${cleanRepo}/contents/${dxfFileName}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${ghToken.trim()}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(putDxfBody),
        });
      }

      setSyncResult({
        type: 'success',
        message: `Berhasil tersinkronisasi ke ${cleanRepo} (${ghBranch})!`,
        url: fileUrl,
        commitSha,
      });
    } catch (err: any) {
      setSyncResult({
        type: 'error',
        message: err.message || 'Terjadi kendala saat melakukan sinkronisasi ke GitHub.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const targetCleanRepo = ghRepo.trim()
    ? ghRepo.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '')
    : 'USERNAME/REPO';
  const targetAuthUrl = ghToken.trim()
    ? `https://${ghToken.trim()}@github.com/${targetCleanRepo}.git`
    : `https://github.com/${targetCleanRepo}.git`;

  const copyGitCommands = () => {
    const cmd = `git remote add origin ${targetAuthUrl} 2>/dev/null || git remote set-url origin ${targetAuthUrl}\ngit branch -M main\ngit push -u origin main`;
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
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
              <h2 className="text-base font-semibold text-white">Ekspor & Sinkronisasi Denah</h2>
              <p className="text-xs text-slate-400">Pilih format PDF gambar kerja, CAD DXF, PNG, atau Sync ke GitHub</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pdf'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF (A4/A3)</span>
          </button>
          <button
            onClick={() => setActiveTab('cad')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cad'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AutoCAD (.DXF)</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'image'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Gambar HD (.PNG)</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'github'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Sync</span>
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
                      <label className="text-[11px] text-slate-400 block mb-1">Judul Gambar / Proyek</label>
                      <input
                        type="text"
                        value={meta.title}
                        onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nama Klien / Pemilik</label>
                      <input
                        type="text"
                        value={meta.client}
                        onChange={(e) => setMeta({ ...meta, client: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Arsitek / Desainer</label>
                      <input
                        type="text"
                        value={meta.architect}
                        onChange={(e) => setMeta({ ...meta, architect: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Revisi / Lembar</label>
                      <input
                        type="text"
                        value={meta.revision}
                        onChange={(e) => setMeta({ ...meta, revision: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
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
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Satuan Ukuran CAD</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, dxfUnit: 'mm' })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      dxfOptions.dxfUnit === 'mm'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Milimeter (mm) - Standar CAD</div>
                    <div className="text-[11px] text-slate-400">1 unit = 1 mm real-world (AutoCAD)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, dxfUnit: 'm' })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      dxfOptions.dxfUnit === 'm'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
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

          {/* TAB 4: GITHUB SYNC */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              {/* Local Git Status Card */}
              <div className="p-3.5 bg-purple-950/30 border border-purple-800/60 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-semibold">
                    <GitBranch className="w-4 h-4 text-purple-400" />
                    <span>Repositori Git Workspace Lokal</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Aktif (branch: main)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Workspace aplikasi telah dikonfigurasi dengan Git lokal dan branch <code className="text-purple-300 bg-purple-950/60 px-1 py-0.5 rounded font-mono">main</code>. Anda dapat menyinkronkan langsung ke akun GitHub Anda melalui formulir di bawah ini, atau menggunakan tombol <strong>Export to GitHub</strong> di menu atas AI Studio.
                </p>
              </div>

              {/* Direct Sync Form */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <CloudUpload className="w-4 h-4 text-blue-400" />
                    Sinkronisasi Langsung ke Repositori GitHub
                  </span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=ArchiPlan+Studio+Sync"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Buat Token GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Target Repo */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Nama Repositori GitHub <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={ghRepo}
                    onChange={(e) => setGhRepo(e.target.value)}
                    placeholder="Contoh: username/nama-repo atau https://github.com/user/repo"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* GitHub Token */}
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Personal Access Token (PAT) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={ghToken}
                      onChange={(e) => setGhToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx atau github_pat_..."
                      className="w-full pl-3 pr-9 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title={showToken ? 'Sembunyikan Token' : 'Lihat Token'}
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Token tersimpan aman di browser Anda dan hanya digunakan untuk membuat commit ke repositori target.
                  </p>
                </div>

                {/* Branch & Options */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Branch Target
                    </label>
                    <input
                      type="text"
                      value={ghBranch}
                      onChange={(e) => setGhBranch(e.target.value)}
                      placeholder="main"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncDXF}
                        onChange={(e) => setSyncDXF(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-800"
                      />
                      <span>Sertakan File AutoCAD .DXF</span>
                    </label>
                  </div>
                </div>

                {/* Result Feedback Banner */}
                {syncResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
                      syncResult.type === 'success'
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                        : 'bg-red-950/40 border-red-800/60 text-red-200'
                    }`}
                  >
                    {syncResult.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold">{syncResult.message}</p>
                      {syncResult.url && (
                        <a
                          href={syncResult.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-300 underline hover:text-emerald-100 font-mono"
                        >
                          <span>Buka File di GitHub ({syncResult.commitSha})</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal CLI Command Helper */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    Opsi Push Source Code Lengkap via Terminal / Git
                  </span>
                  <button
                    onClick={copyGitCommands}
                    className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 flex items-center gap-1 transition-colors"
                  >
                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd ? 'Tersalin!' : 'Salin Perintah'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed select-all whitespace-pre-wrap">
                  {`git remote add origin ${targetAuthUrl} 2>/dev/null || git remote set-url origin ${targetAuthUrl}\ngit branch -M main\ngit push -u origin main`}
                </pre>
              </div>

              {/* GitHub Pages Automatic Deployment Guide */}
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Deploy Otomatis ke GitHub Pages (CI/CD Siap Pakai)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Repositori ini sudah dilengkapi alur otomatisasi <code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded font-mono">.github/workflows/deploy.yml</code>. Setiap kali Anda push ke GitHub:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-300">
                  <li>Buka repositori di GitHub dan klik <strong>Settings</strong> &rarr; <strong>Pages</strong>.</li>
                  <li>Di menu <strong>Build and deployment</strong> &rarr; <strong>Source</strong>, pilih <strong>GitHub Actions</strong>.</li>
                  <li>Aplikasi web interaktif akan otomatis terbit dan dapat diakses langsung oleh siapa saja di link <code>https://&lt;username&gt;.github.io/&lt;repo&gt;/</code>!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs text-slate-400">
            {activeTab === 'github' ? 'Sinkronisasi real-time via GitHub API' : `${shapes.length} elemen denah siap diekspor`}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Tutup
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
            {activeTab === 'github' && (
              <button
                onClick={handleSyncToGitHub}
                disabled={isSyncing}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Menyinkronkan...</span>
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    <span>Sync / Push ke GitHub</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
