import { useState, useEffect, useRef } from "react";
import {
  Store,
  Phone,
  MapPin,
  Map,
  Key,
  Save,
  Loader2,
  Info,
  Search,
  CheckCircle2,
} from "lucide-react";
import api from "../api/axios";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    store_name: "",
    phone: "",
    address: "",
    postal_code: "",
    biteship_origin_area_id: "",
    area_name: "", // Kolom baru
  });

  // State khusus untuk pencarian area Biteship
  const [searchAreaQuery, setSearchAreaQuery] = useState("");
  const [areaResults, setAreaResults] = useState([]);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchSettings();

    // Tutup dropdown jika klik di luar area
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAreaDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings");
      if (res.data.data) {
        setFormData({
          store_name: res.data.data.store_name || "",
          phone: res.data.data.phone || "",
          address: res.data.data.address || "",
          postal_code: res.data.data.postal_code || "",
          biteship_origin_area_id: res.data.data.biteship_origin_area_id || "",
          area_name: res.data.data.area_name || "",
        });
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan:", error);
      setMessage({
        type: "error",
        text: "Gagal memuat data pengaturan dari server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --- FUNGSI PENCARIAN AREA BITESHIP ---
  const handleSearchArea = async (e) => {
    const query = e.target.value;
    setSearchAreaQuery(query);

    if (query.length < 3) {
      setAreaResults([]);
      setShowAreaDropdown(false);
      return;
    }

    setIsSearchingArea(true);
    setShowAreaDropdown(true);

    try {
      // GANTI URL INI dengan endpoint pencarian area Biteship Anda (yang sama dengan milik Customer)
      // Contoh: '/areas/search?q=' atau '/biteship/maps?input='
      const res = await api.get(`/areas?search=${query}`);

      // Sesuaikan pembacaan JSON dengan format respon API Anda
      const areas = res.data.areas || res.data.data || [];
      setAreaResults(areas);
    } catch (error) {
      console.error("Gagal mencari area:", error);
      setAreaResults([]);
    } finally {
      setIsSearchingArea(false);
    }
  };

  const selectArea = (area) => {
    setFormData({
      ...formData,
      biteship_origin_area_id: area.id,
      area_name: area.name,
      postal_code: area.postal_code || formData.postal_code, // Otomatis isi kode pos jika ada
    });
    setSearchAreaQuery("");
    setShowAreaDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    // --- JURUS ANTI-ERROR: Paksa postal_code menjadi String (Teks) ---
    const payload = {
      ...formData,
      postal_code: formData.postal_code ? String(formData.postal_code) : "",
    };

    try {
      // Kirim payload yang sudah di-convert
      await api.put("/settings", payload);

      setMessage({
        type: "success",
        text: "PENGATURAN BERHASIL DISIMPAN! Cache telah dibersihkan.",
      });
      window.scrollTo(0, 0);
      setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      setMessage({
        type: "error",
        text: "Gagal menyimpan pengaturan. Silakan coba lagi.",
      });
      window.scrollTo(0, 0);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
        <h2 className="text-2xl font-black uppercase tracking-widest animate-pulse">
          Memuat Konfigurasi...
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto relative text-white font-sans pb-12">
      <div className="border-b-4 border-gray-800 pb-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
          Pengaturan.
        </h1>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">
          Konfigurasi Toko & Parameter Logistik Pusat
        </p>
      </div>

      {message.text && (
        <div
          className={`mb-8 p-4 border-4 font-black uppercase tracking-widest flex items-center gap-3 ${message.type === "success" ? "bg-green-900 border-green-500 text-green-300" : "bg-red-900 border-red-500 text-red-300"}`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={24} />
          ) : (
            <Info size={24} />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* BLOK 1: IDENTITAS TOKO */}
        <div className="bg-[#0a0a0a] border-4 border-gray-800 p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(30,30,30,1)]">
          <h2 className="text-xl font-black uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-2 text-gray-300">
            Identitas Toko
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Store size={14} /> Nama Toko / Bisnis
              </label>
              <input
                type="text"
                name="store_name"
                value={formData.store_name}
                onChange={handleChange}
                required
                className="w-full bg-[#121212] border-4 border-gray-700 p-3 text-white font-bold focus:border-white focus:outline-none transition-colors"
                placeholder="Misal: Riff Fashion"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Phone size={14} /> Nomor Telepon (CS/Pengirim)
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full bg-[#121212] border-4 border-gray-700 p-3 text-white font-mono font-bold focus:border-white focus:outline-none transition-colors"
                placeholder="Misal: 08123456789"
              />
            </div>
          </div>
        </div>

        {/* BLOK 2: LOKASI & LOGISTIK */}
        <div className="bg-[#0a0a0a] border-4 border-blue-900 p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(30,58,136,0.3)]">
          <h2 className="text-xl font-black uppercase tracking-widest mb-6 border-b-2 border-blue-900 pb-2 text-blue-400">
            Parameter Logistik & Penjemputan
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <MapPin size={14} /> Alamat Lengkap Toko (Untuk Penjemputan
                Kurir)
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows="3"
                className="w-full bg-[#121212] border-4 border-gray-700 p-3 text-white font-bold focus:border-blue-500 focus:outline-none transition-colors resize-none"
                placeholder="Nama Jalan, RT/RW, Patokan..."
              ></textarea>
            </div>

            {/* PENCARIAN AREA (AUTOCOMPLETE) */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
                <Search size={14} /> Cari Kecamatan / Area Pengiriman
              </label>
              <input
                type="text"
                value={searchAreaQuery}
                onChange={handleSearchArea}
                className="w-full bg-[#121212] border-4 border-blue-700 p-3 text-white font-bold focus:border-blue-400 focus:outline-none transition-colors placeholder:text-gray-600"
                placeholder="Ketik minimal 3 huruf nama kecamatan atau kota (cth: Cileunyi)..."
              />

              {/* Hasil Pencarian Dropdown */}
              {showAreaDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border-4 border-blue-700 shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                  {isSearchingArea ? (
                    <div className="p-4 text-center text-gray-400 font-bold uppercase text-xs">
                      Mencari Area...
                    </div>
                  ) : areaResults.length > 0 ? (
                    areaResults.map((area, index) => (
                      <div
                        key={index}
                        onClick={() => selectArea(area)}
                        className="p-3 border-b-2 border-gray-800 hover:bg-blue-900 cursor-pointer transition-colors"
                      >
                        <p className="font-bold text-sm text-white">
                          {area.name}
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          ID: {area.id} | Kode Pos: {area.postal_code || "-"}
                        </p>
                      </div>
                    ))
                  ) : searchAreaQuery.length >= 3 ? (
                    <div className="p-4 text-center text-red-400 font-bold uppercase text-xs">
                      Area tidak ditemukan
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* DATA AREA YANG TERPILIH (READONLY) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#121212] border-2 border-gray-800 border-dashed">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <Map size={14} /> Area Terpilih (Otomatis)
                </label>
                <input
                  type="text"
                  name="area_name"
                  value={formData.area_name}
                  readOnly
                  className="w-full bg-transparent border-b-2 border-gray-700 p-2 text-green-400 font-bold outline-none cursor-not-allowed"
                  placeholder="Belum ada area terpilih"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <Key size={14} /> Origin Area ID (Otomatis)
                </label>
                <input
                  type="text"
                  name="biteship_origin_area_id"
                  value={formData.biteship_origin_area_id}
                  readOnly
                  className="w-full bg-transparent border-b-2 border-gray-700 p-2 text-green-400 font-mono font-bold outline-none cursor-not-allowed"
                  placeholder="IDNP..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Map size={14} /> Kode Pos Asal
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                required
                className="w-full bg-[#121212] border-4 border-gray-700 p-3 text-white font-mono font-bold focus:border-white focus:outline-none transition-colors md:w-1/2"
                placeholder="Misal: 40622"
              />
            </div>
          </div>
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black border-4 border-white font-black uppercase tracking-widest hover:bg-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[6px_6px_0px_0px_rgba(100,100,100,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]"
          >
            {isSaving ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <Save size={24} />
            )}
            {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </div>
      </form>
    </div>
  );
}
