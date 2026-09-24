import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  MousePointer,
  PenTool,
  Maximize,
  Undo2,
  Layers,
  FileDown,
  Ruler,
  LayoutTemplate,
  Sliders,
  Sparkles,
  Keyboard,
  Lightbulb,
  CheckCircle,
  Copy,
  Lock,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTemplates: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, onOpenTemplates }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'quick' | 'tools' | 'custom' | 'shortcuts'>('quick');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden text-slate-100 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Panduan Penggunaan & Tips Desain</h2>
              <p className="text-xs text-slate-400">
                Pelajari fungsi setiap tombol dan cara membuat denah arsitektur dengan mudah
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800 bg-slate-950/40 overflow-x-auto no-scrollbar">
          {[
            { id: 'quick', label: 'Mulai Cepat', icon: Sparkles },
            { id: 'tools', label: 'Fungsi Tombol', icon: MousePointer },
            { id: 'custom', label: 'Tips & Bikin Shape', icon: PenTool },
            { id: 'shortcuts', label: 'Pintasan Keyboard', icon: Keyboard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-300">
          {/* TAB 1: QUICK START */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl space-y-2">
                <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  3 Langkah Mudah Membuat Denah
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Aplikasi ini dirancang ringan dan responsif. Anda dapat mulai dari kanvas kosong bersih atau memuat template siap pakai.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                    1
                  </div>
                  <h4 className="font-bold text-white text-xs">Pilih / Tambah Ruangan</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Klik menu di panel kiri (Dinding, Pintu, Jendela, Perabot) lalu klik tombol "+ Tambah" untuk meletakkannya di kanvas.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    2
                  </div>
                  <h4 className="font-bold text-white text-xs">Atur Posisi & Ukuran Presisi</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Klik elemen untuk menggesernya. Buka <strong>Panel Detail</strong> di kanan untuk mengetik ukuran spesifik (misal 3.5 m × 4.0 m).
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/60 border border-slate-700/70 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                    3
                  </div>
                  <h4 className="font-bold text-white text-xs">Ekspor ke PDF & CAD</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Klik tombol biru <strong>Ekspor PDF / CAD</strong> di toolbar atas untuk mengunduh dokumen cetak PDF atau file DXF AutoCAD.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-xs">Ingin melihat contoh denah langsung?</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Buka pustaka template apartemen, rumah tinggal, kantor, atau kafe.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenTemplates();
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 shadow-sm"
                >
                  Buka Pustaka Template
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TOOLS GUIDE */}
          {activeTab === 'tools' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs">
                Penjelasan tombol-tombol utama di toolbar dan area kerja:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/60 border border-slate-700/70 rounded-xl flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 shrink-0">
                    <MousePointer className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Tombol "Pilih" (Shortcut V)</h4>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Alat utama untuk memilih ruangan/objek di kanvas, menggeser posisinya, memutar dengan tuas atas, atau mengubah ukuran lewat 8 titik sudut.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 border border-slate-700/70 rounded-xl flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 shrink-0">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Tombol "Gambar Bebas" (Shortcut P)</h4>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Fitur untuk membuat shape poligon sendiri dengan jumlah sudut bebas. Klik pada kanvas untuk setiap titik sudut, lalu klik titik awal merah untuk selesai.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 border border-slate-700/70 rounded-xl flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400 shrink-0">
                    <Maximize className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Tombol "Geser Kanvas" (Shortcut H / Spasi)</h4>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Menggeser area gambar kanvas. Anda juga bisa menahan tombol <strong>Spasi</strong> sambil menarik mouse di mana saja di kanvas.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 border border-slate-700/70 rounded-xl flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 shrink-0">
                    <Undo2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Undo / Redo & Riwayat (Ctrl+Z)</h4>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Membatalkan atau mengulang langkah tindakan. Klik tanda panah kecil di samping tombol untuk melihat daftar riwayat dan melompat ke langkah mana pun.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 border border-slate-700/70 rounded-xl flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Tombol "Layer CAD" (Shortcut L)</h4>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Membuka panel layer untuk menyembunyikan, mengunci, memberi warna, mengubah urutan tumpukan, atau menambah layer baru.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 border border-slate-700/70 rounded-xl flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Tombol "Panel Detail" (Kanan)</h4>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Dapat disembunyikan / dibuka kapan saja agar kanvas lebih luas dan ringan. Berisi kalkulator luas otomatis, rasio aspek, dan input angka presisi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM SHAPE & PRECISION TIPS */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/60 border border-slate-700/70 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-emerald-400" />
                  Cara Bikin Shape / Bentuk Sendiri (Poligon Bebas)
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                  <li>
                    Klik tombol <strong>"Gambar Bebas"</strong> di toolbar atas atau tombol <strong>"+ Bikin Shape Sendiri"</strong> di panel kiri.
                  </li>
                  <li>
                    Klik di titik pertama di kanvas, lalu geser mouse ke titik kedua. Jarak garis (meter) akan tampil di samping kursor.
                  </li>
                  <li>
                    Klik untuk setiap sudut bentuk yang ingin Anda buat (misal bentuk L, T, atau miring).
                  </li>
                  <li>
                    Untuk menutup bentuk, klik pada <strong>lingkaran merah pertama</strong> atau tekan tombol <kbd className="px-1 py-0.5 bg-slate-700 rounded text-white font-mono">Enter</kbd>.
                  </li>
                  <li>
                    Bentuk kustom siap digunakan! Anda dapat menggeser sudut poligon secara bebas menggunakan titik merah muda.
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700/70 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Label Dimensi Otomatis & Anti-Tabrakan Cerdas (Auto-Avoid Overlap)
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Aplikasi dilengkapi algoritma penataan label cerdas:
                </p>
                <ul className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Pergeseran Dinamis Teks Ruangan:</strong> Jika bagian tengah ruangan terhalang oleh tempat tidur, meja, kolom, atau partisi dinding yang digeser, kotak nama dan luas ruangan otomatis mencari area lapang (utara, selatan, barat, timur, atau kuadran) disertai garis penunjuk (leader line) arsitektural.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Pembalikan Otomatis Angka Ukuran Sisi Luar:</strong> Angka dimensi dinding otomatis membalik ke dalam ruangan atau ke sisi yang bersih saat ada dinding atau ruangan lain yang menempel rapat di tepinya.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Kontrol Fleksibel:</strong> Fitur ini aktif secara default dan dapat disesuaikan di menu widget sudut kanan bawah atau di panel detail kanan.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-slate-800/60 border border-slate-700/70 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  Tips Memasukkan Ukuran Angka Presisi
                </h4>
                <ul className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Input Angka Langsung:</strong> Buka Panel Detail di sebelah kanan, lalu ketik angka panjang dan lebar (dalam meter atau cm). Ukuran akan langsung terkalibrasi ke skala kanvas.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Kunci Rasio Aspek:</strong> Aktifkan gembok rasio (misal 1:1 untuk bujur sangkar, 4:3, dll.) agar saat ditarik proporsi bentuk tetap terjaga.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Duplikasi dengan Jarak Spesifik:</strong> Gunakan fitur duplikasi dengan offset ΔX dan ΔY untuk membuat barisan kolom, jendela, atau meja dengan jarak yang tepat.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Kunci Layer:</strong> Kunci layer dinding setelah selesai agar saat menambahkan perabot tidak sengaja menggeser dinding denah.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Keyboard className="w-4 h-4 text-blue-400" />
                    Pintasan Keyboard Arsitektur Cepat
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kombinasi tombol utama untuk navigasi dan pengelolaan ruang kerja dengan cepat.
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                    Q
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                    W
                  </span>
                </div>
              </div>

              <div className="border border-slate-700/80 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                      <th className="py-2.5 px-3">Kategori & Tindakan</th>
                      <th className="py-2.5 px-3">Pintasan Keyboard</th>
                      <th className="py-2.5 px-3 hidden sm:table-cell text-slate-400 font-normal">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
                    {/* Primary Requested Shortcuts */}
                    <tr className="bg-blue-950/20">
                      <td className="py-2.5 px-3 text-white font-sans font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Buka / Tutup Menu Bentuk
                      </td>
                      <td className="py-2.5 px-3 text-blue-400 font-bold">Q</td>
                      <td className="py-2.5 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Tampilkan atau sembunyikan sidebar pustaka bentuk di kiri (bisa juga Ctrl+Q)
                      </td>
                    </tr>
                    <tr className="bg-blue-950/20">
                      <td className="py-2.5 px-3 text-white font-sans font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Buka / Tutup Menu Detail Ukuran
                      </td>
                      <td className="py-2.5 px-3 text-blue-400 font-bold">W</td>
                      <td className="py-2.5 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Tampilkan atau sembunyikan panel inspektor ukuran presisi di kanan (bisa juga Ctrl+W)
                      </td>
                    </tr>
                    <tr className="bg-amber-950/20">
                      <td className="py-2.5 px-3 text-white font-sans font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        Geser Item Terpilih (Nudge)
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">↑ ↓ ← → (Arrow Keys)</td>
                      <td className="py-2.5 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Geser elemen per 5cm (+Shift: 50cm, +Alt: 1cm) disertai indikator jarak ke dinding/objek terdekat
                      </td>
                    </tr>

                    {/* File & Export Shortcuts */}
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Simpan Proyek</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">Ctrl + S</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Simpan denah ke file format .archiplan.json
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Buka File Proyek</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">Ctrl + O</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Muat file proyek denah tersimpan
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Ekspor Denah</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">Ctrl + E</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Buka jendela ekspor (PDF skala arsitek, PNG, DXF, SVG)
                      </td>
                    </tr>

                    {/* Editing & History */}
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Undo (Batalkan Langkah)</td>
                      <td className="py-2 px-3 text-amber-400 font-bold">Ctrl + Z</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Kembali ke langkah sebelumnya
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Redo (Ulangi Langkah)</td>
                      <td className="py-2 px-3 text-amber-400 font-bold">Ctrl + Y / Ctrl + Shift + Z</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Ulangi langkah yang telah dibatalkan
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Duplikasi Bentuk Terpilih</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">Ctrl + D</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Salin elemen terpilih dengan offset otomatis
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Hapus Bentuk Terpilih</td>
                      <td className="py-2 px-3 text-rose-400 font-bold">Delete / Backspace</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Hapus elemen yang sedang dipilih dari denah
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Batal / Lepas Pilihan</td>
                      <td className="py-2 px-3 text-slate-300 font-bold">Escape</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Deselect bentuk atau batalkan pembuatan poligon
                      </td>
                    </tr>

                    {/* Drawing & Navigation Tools */}
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Alat Pilih / Seleksi</td>
                      <td className="py-2 px-3 text-cyan-400 font-bold">V</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Pindah ke mode cursor seleksi dan geser bentuk
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Bikin Poligon Bebas (Kustom)</td>
                      <td className="py-2 px-3 text-cyan-400 font-bold">P</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Mulai klik sudut demi sudut untuk membentuk shape sendiri
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Geser Kanvas (Pan Laptop / PC)</td>
                      <td className="py-2 px-3 text-cyan-400 font-bold">Tahan [Spasi] + Mousepad</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Tahan Spasi lalu geser trackpad tanpa klik tahan; Cubit (Pinch) 2 jari untuk zoom in & out
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Pusatkan Denah (Fit to Screen)</td>
                      <td className="py-2 px-3 text-cyan-400 font-bold">F</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Otomatis atur zoom dan pan agar seluruh denah terlihat di tengah
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Tampilkan / Sembunyikan Grid</td>
                      <td className="py-2 px-3 text-purple-400 font-bold">G</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Toggle garis bantu grid millimeter
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Magnet Snap ke Grid</td>
                      <td className="py-2 px-3 text-purple-400 font-bold">M</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Toggle snap titik grid saat menggeser atau mengubah ukuran
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Buka / Tutup Panel Layer</td>
                      <td className="py-2 px-3 text-purple-400 font-bold">L</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Kelola visibilitas layer dinding, bukaan, perabot, dan dimensi
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Pustaka Template Denah</td>
                      <td className="py-2 px-3 text-cyan-400 font-bold">T</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Buka pilihan denah siap pakai (Studio, Rumah 2KT, dsb)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Zoom In / Zoom Out</td>
                      <td className="py-2 px-3 text-slate-300 font-bold">+  /  -</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Perbesar atau perkecil tampilan kanvas (atau scroll roda mouse)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Reset Zoom 100%</td>
                      <td className="py-2 px-3 text-slate-300 font-bold">Ctrl + 0</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Kembalikan zoom ke skala natural 1:1
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-300 font-sans">Buka Panduan & Pintasan</td>
                      <td className="py-2 px-3 text-amber-400 font-bold">?</td>
                      <td className="py-2 px-3 hidden sm:table-cell text-slate-400 font-sans text-[10px]">
                        Buka jendela bantuan ini kapan saja
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Tips: Kanvas selalu siap dengan skala otomatis 1:50 presisi
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            Mengerti & Mulai Mendesain
          </button>
        </div>
      </div>
    </div>
  );
};
