import React, { useState } from 'react';
import { LayerItem, CADShape } from '../types/cad';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  X,
  Palette,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface LayerManagerProps {
  layers: LayerItem[];
  shapes: CADShape[];
  selectedShapeId: string | null;
  onUpdateLayers: (newLayers: LayerItem[], actionDesc?: string) => void;
  onAssignShapeToLayer: (shapeId: string, layerId: string) => void;
}

export const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  shapes,
  selectedShapeId,
  onUpdateLayers,
  onAssignShapeToLayer,
}) => {
  const [isAddingLayer, setIsAddingLayer] = useState<boolean>(false);
  const [newLayerName, setNewLayerName] = useState<string>('');
  const [newLayerCad, setNewLayerCad] = useState<string>('');
  const [newLayerColor, setNewLayerColor] = useState<string>('#3b82f6');

  // Inline rename state
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // Count shapes per layer
  const getShapeCount = (layerId: string, cadName: string) => {
    return shapes.filter((s) => s.layerId === layerId || s.layer === cadName).length;
  };

  // Toggle Visibility
  const handleToggleVisible = (id: string) => {
    const updated = layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l));
    const target = layers.find((l) => l.id === id);
    onUpdateLayers(
      updated,
      `${target?.visible ? 'Sembunyikan' : 'Tampilkan'} Layer ${target?.name}`
    );
  };

  // Toggle Lock
  const handleToggleLock = (id: string) => {
    const updated = layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l));
    const target = layers.find((l) => l.id === id);
    onUpdateLayers(
      updated,
      `${target?.locked ? 'Buka Kunci' : 'Kunci'} Layer ${target?.name}`
    );
  };

  // Move Layer Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newLayers = [...layers];
    const temp = newLayers[index];
    newLayers[index] = newLayers[index - 1];
    newLayers[index - 1] = temp;
    onUpdateLayers(newLayers, `Ubah Urutan Layer: ${temp.name} Naik`);
  };

  // Move Layer Down
  const handleMoveDown = (index: number) => {
    if (index === layers.length - 1) return;
    const newLayers = [...layers];
    const temp = newLayers[index];
    newLayers[index] = newLayers[index + 1];
    newLayers[index + 1] = temp;
    onUpdateLayers(newLayers, `Ubah Urutan Layer: ${temp.name} Turun`);
  };

  // Rename Layer
  const handleStartRename = (layer: LayerItem) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const handleSaveRename = (id: string) => {
    if (!editingName.trim()) return;
    const updated = layers.map((l) => (l.id === id ? { ...l, name: editingName.trim() } : l));
    onUpdateLayers(updated, `Ganti Nama Layer Menjadi "${editingName.trim()}"`);
    setEditingLayerId(null);
  };

  // Delete Layer
  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) {
      alert('Minimal harus ada satu layer pada denah.');
      return;
    }
    const target = layers.find((l) => l.id === id);
    if (!confirm(`Hapus layer "${target?.name}"? Elemen pada layer ini akan dipindahkan ke layer utama.`)) {
      return;
    }
    const fallbackLayer = layers.find((l) => l.id !== id);
    if (fallbackLayer) {
      // Reassign shapes
      shapes.forEach((s) => {
        if (s.layerId === id || s.layer === target?.cadLayerName) {
          onAssignShapeToLayer(s.id, fallbackLayer.id);
        }
      });
    }
    const updated = layers.filter((l) => l.id !== id);
    onUpdateLayers(updated, `Hapus Layer ${target?.name}`);
  };

  // Create New Layer
  const handleCreateLayer = () => {
    if (!newLayerName.trim()) return;
    const cadName = (newLayerCad.trim() || newLayerName.trim().replace(/\s+/g, '_')).toUpperCase();
    const newLayer: LayerItem = {
      id: `layer-${Date.now()}`,
      name: newLayerName.trim(),
      cadLayerName: cadName,
      color: newLayerColor,
      visible: true,
      locked: false,
    };
    onUpdateLayers([...layers, newLayer], `Tambah Layer Baru "${newLayer.name}"`);
    setNewLayerName('');
    setNewLayerCad('');
    setIsAddingLayer(false);
  };

  // Bulk Actions
  const handleToggleAllVisibility = () => {
    const allVisible = layers.every((l) => l.visible);
    const updated = layers.map((l) => ({ ...l, visible: !allVisible }));
    onUpdateLayers(updated, allVisible ? 'Sembunyikan Semua Layer' : 'Tampilkan Semua Layer');
  };

  const handleToggleAllLock = () => {
    const allLocked = layers.every((l) => l.locked);
    const updated = layers.map((l) => ({ ...l, locked: !allLocked }));
    onUpdateLayers(updated, allLocked ? 'Buka Kunci Semua Layer' : 'Kunci Semua Layer');
  };

  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Manajemen Layer CAD ({layers.length})
          </span>
        </div>
        <button
          onClick={() => setIsAddingLayer(!isAddingLayer)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Layer Baru
        </button>
      </div>

      {/* Bulk action buttons */}
      <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAllVisibility}
            className="hover:text-white transition-colors"
          >
            {layers.every((l) => l.visible) ? 'Sembunyikan Semua' : 'Tampilkan Semua'}
          </button>
          <span>•</span>
          <button
            onClick={handleToggleAllLock}
            className="hover:text-white transition-colors"
          >
            {layers.every((l) => l.locked) ? 'Buka Kunci Semua' : 'Kunci Semua'}
          </button>
        </div>
      </div>

      {/* Selected shape assignment helper */}
      {selectedShape && (
        <div className="p-2.5 bg-blue-950/30 border-b border-blue-900/50 text-xs">
          <div className="text-[11px] text-blue-300 font-medium truncate mb-1">
            Pilih layer untuk: <strong className="text-white">{selectedShape.name}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={selectedShape.layerId || selectedShape.layer}
              onChange={(e) => onAssignShapeToLayer(selectedShape.id, e.target.value)}
              className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {layers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.cadLayerName})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Create New Layer Form Modal/Inline */}
      {isAddingLayer && (
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Buat Layer Arsitektur Baru</span>
            <button
              onClick={() => setIsAddingLayer(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Nama Layer</label>
              <input
                type="text"
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                placeholder="Contoh: Plafon / Ceiling"
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Nama CAD DXF</label>
                <input
                  type="text"
                  value={newLayerCad}
                  onChange={(e) => setNewLayerCad(e.target.value)}
                  placeholder="CEILING"
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono uppercase text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Warna Penanda</label>
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded px-2 py-0.5">
                  <input
                    type="color"
                    value={newLayerColor}
                    onChange={(e) => setNewLayerColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300 uppercase">{newLayerColor}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCreateLayer}
              disabled={!newLayerName.trim()}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-bold transition-all shadow-sm"
            >
              Simpan & Tambahkan Layer
            </button>
          </div>
        </div>
      )}

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {layers.map((layer, index) => {
          const count = getShapeCount(layer.id, layer.cadLayerName);
          const isEditing = editingLayerId === layer.id;

          return (
            <div
              key={layer.id}
              className={`p-2 rounded-lg border transition-all ${
                layer.visible
                  ? 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800'
                  : 'bg-slate-900/50 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                {/* Left: Reorder buttons & Color swatch */}
                <div className="flex items-center gap-1">
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="text-slate-400 hover:text-white disabled:opacity-20 p-0.5"
                      title="Naikkan Urutan Tumpukan"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === layers.length - 1}
                      className="text-slate-400 hover:text-white disabled:opacity-20 p-0.5"
                      title="Turunkan Urutan Tumpukan"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                    style={{ backgroundColor: layer.color }}
                  />
                </div>

                {/* Center: Layer Name & CAD Name */}
                <div className="flex-1 min-w-0 px-1">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-1.5 py-0.5 bg-slate-900 border border-blue-500 rounded text-xs text-white focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(layer.id);
                          if (e.key === 'Escape') setEditingLayerId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveRename(layer.id)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDoubleClick={() => handleStartRename(layer)}
                      className="cursor-pointer group flex items-center justify-between"
                    >
                      <div className="truncate">
                        <span className="text-xs font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {layer.name}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {layer.cadLayerName} • {count} objek
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartRename(layer)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                        title="Ubah Nama Layer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Actions (Visibility, Lock, Delete) */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => handleToggleVisible(layer.id)}
                    className={`p-1.5 rounded transition-colors ${
                      layer.visible
                        ? 'text-blue-400 hover:bg-slate-700'
                        : 'text-slate-500 hover:bg-slate-750'
                    }`}
                    title={layer.visible ? 'Sembunyikan Layer' : 'Tampilkan Layer'}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={() => handleToggleLock(layer.id)}
                    className={`p-1.5 rounded transition-colors ${
                      layer.locked
                        ? 'text-amber-400 hover:bg-slate-700'
                        : 'text-slate-500 hover:bg-slate-750'
                    }`}
                    title={layer.locked ? 'Buka Kunci Layer' : 'Kunci Layer (Cegah Edit Tidak Sengaja)'}
                  >
                    {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* Delete button (only if more than 1 layer) */}
                  {layers.length > 1 && (
                    <button
                      onClick={() => handleDeleteLayer(layer.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      title="Hapus Layer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
