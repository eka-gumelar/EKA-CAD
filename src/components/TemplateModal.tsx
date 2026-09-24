import React, { useState, useMemo } from 'react';
import { FloorPlanTemplate, TemplateCategory } from '../types/cad';
import { FLOOR_PLAN_TEMPLATES } from '../utils/samplePlans';
import {
  Building,
  Home,
  Briefcase,
  Store,
  LayoutGrid,
  Check,
  X,
  Search,
  Sparkles,
  Maximize2,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: FloorPlanTemplate) => void;
  onSelectEmptyCanvas: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onSelectEmptyCanvas,
}) => {
  if (!isOpen) return null;

  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(FLOOR_PLAN_TEMPLATES[0].id);

  const categories = [
    { id: 'all', label: 'Semua Template', icon: LayoutGrid },
    { id: 'apartment', label: 'Apartemen', icon: Building },
    { id: 'house', label: 'Rumah Tinggal', icon: Home },
    { id: 'office', label: 'Kantor & Kerja', icon: Briefcase },
    { id: 'commercial', label: 'Ruang Komersial', icon: Store },
  ];

  const filteredTemplates = useMemo(() => {
    return FLOOR_PLAN_TEMPLATES.filter((tpl) => {
      const matchCat = activeCategory === 'all' || tpl.category === activeCategory;
      const matchSearch =
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const activeTemplate = useMemo(() => {
    return (
      FLOOR_PLAN_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      filteredTemplates[0] ||
      FLOOR_PLAN_TEMPLATES[0]
    );
  }, [selectedTemplateId, filteredTemplates]);

  const handleApply = (tpl: FloorPlanTemplate) => {
    if (confirm(`Gunakan template "${tpl.title}"? Denah di kanvas akan dimuat ulang dengan template ini.`)) {
      onSelectTemplate(tpl);
      onClose();
    }
  };

  const handleEmpty = () => {
    if (confirm('Buka kanvas kosong bersih? Semua elemen saat ini akan dihapus.')) {
      onSelectEmptyCanvas();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Pustaka Template Denah Arsitektur</h2>
              <p className="text-xs text-slate-400">
                Pilih denah siap pakai untuk apartemen, rumah tinggal, kantor modern, atau ruang komersial
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

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari denah, ruangan, ukuran..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Body content: Left List, Right Detailed Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Grid / List (7 cols) */}
          <div className="md:col-span-7 p-5 overflow-y-auto border-r border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Menampilkan {filteredTemplates.length} Template Pilihan</span>
              <button
                onClick={handleEmpty}
                className="text-blue-400 hover:text-blue-300 font-medium underline"
              >
                + Mulai dari Kanvas Kosong
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                        : 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {tpl.categoryLabel}
                        </span>
                        {tpl.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {tpl.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-white leading-snug line-clamp-1">
                        {tpl.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-slate-300">
                      <span className="text-emerald-400 font-bold">{tpl.areaM2} m²</span>
                      <span className="text-slate-400">{tpl.dimensions}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Preview Card (5 cols) */}
          {activeTemplate && (
            <div className="md:col-span-5 p-6 bg-slate-950/40 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Schematic Visual Box */}
                <div className="h-44 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px]" />
                  
                  {/* Schematic rooms rendering */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 500 350" className="w-full h-full max-h-36 drop-shadow-md">
                      {activeTemplate.shapes.map((s, idx) => (
                        <g key={s.id || idx}>
                          <rect
                            x={Math.max(10, Math.min(400, s.x - 50))}
                            y={Math.max(10, Math.min(280, s.y - 40))}
                            width={Math.max(30, s.width * 0.7)}
                            height={Math.max(25, s.height * 0.7)}
                            fill={s.category === 'room' ? '#1e293b' : '#334155'}
                            stroke={s.category === 'room' ? '#38bdf8' : '#94a3b8'}
                            strokeWidth={1.5}
                            rx={3}
                            opacity={0.85}
                          />
                        </g>
                      ))}
                    </svg>
                  </div>

                  <div className="absolute bottom-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
                    Skala Presisi
                  </div>
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      {activeTemplate.categoryLabel}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{activeTemplate.roomCount} Ruangan</span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-1">{activeTemplate.title}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {activeTemplate.description}
                  </p>
                </div>

                {/* Dimension & Area Badges */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase">Luas Bangunan</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {activeTemplate.areaM2} m²
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase">Dimensi Bersih</div>
                    <div className="text-sm font-bold text-blue-300 font-mono mt-0.5">
                      {activeTemplate.dimensions}
                    </div>
                  </div>
                </div>

                {/* Features Pill List */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Fasilitas & Pembagian Ruang:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTemplate.features.map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t border-slate-800 flex items-center gap-2.5">
                <button
                  onClick={() => handleApply(activeTemplate)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 transition-all"
                >
                  <span>Gunakan Template Ini</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
