import { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Ban,
  CheckCircle,
  UserX,
  UserCheck,
  X,
  Save,
  Loader2,
  Users,
} from "lucide-react";
import api from "../api/axios";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // State Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState({
    id: null,
    name: "",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/customers");
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error("Gagal memuat pelanggan:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI BANNED / UNBANNED ---
  const handleToggleBan = async (customer) => {
    const action = customer.is_banned ? "mengaktifkan kembali" : "MEMBLOKIR";
    if (
      !window.confirm(
        `Apakah Anda yakin ingin ${action} akun ${customer.name}?`,
      )
    )
      return;

    try {
      await api.patch(`/customers/${customer.id}/ban`);
      fetchCustomers(); // Refresh data otomatis
    } catch (error) {
      console.error("Gagal mengubah status blokir:", error);
      alert("Terjadi kesalahan sistem.");
    }
  };

  // --- FUNGSI EDIT DATA ---
  const openEditModal = (customer) => {
    setEditingCustomer({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/customers/${editingCustomer.id}`, {
        name: editingCustomer.name,
        phone: editingCustomer.phone,
      });
      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error("Gagal update data:", error);
      alert("Gagal menyimpan data pelanggan.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- FILTER PENCARIAN ---
  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto relative text-white font-sans pb-12">
      {/* HEADER */}
      <div className="border-b-4 border-gray-800 pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
            Pelanggan.
          </h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">
            Manajemen Basis Data & Keamanan Akun
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Users size={32} className="text-gray-600" />
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Total Akun
            </p>
            <p className="text-2xl font-black font-mono">{customers.length}</p>
          </div>
        </div>
      </div>

      {/* PENCARIAN */}
      <div className="mb-6 relative w-full md:w-1/2">
        <input
          type="text"
          placeholder="Cari Nama atau Email Pelanggan..."
          className="w-full pl-12 pr-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] focus:border-gray-500 focus:outline-none transition-all font-bold text-sm uppercase text-white placeholder:normal-case placeholder:text-gray-600"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
          size={20}
        />
      </div>

      {/* TABEL DATA PELANGGAN */}
      <div className="bg-[#121212] border-4 border-gray-800 shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center font-black uppercase tracking-widest animate-pulse border-b-4 border-gray-800 text-gray-500">
            Memuat Data Pelanggan...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center font-bold uppercase tracking-widest text-gray-500 border-b-4 border-gray-800">
            Tidak ada pelanggan ditemukan.
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px] border-b-4 border-gray-800">
            <thead>
              <tr className="bg-[#1a1a1a] text-gray-300 uppercase text-xs tracking-widest border-b-4 border-gray-800">
                <th className="p-4 font-black">Identitas</th>
                <th className="p-4 font-black">Kontak</th>
                <th className="p-4 font-black">Bergabung</th>
                <th className="p-4 font-black text-center">Status</th>
                <th className="p-4 font-black text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className={`border-b-2 border-gray-800 transition-colors ${customer.is_banned ? "bg-red-950/20" : "hover:bg-[#1a1a1a]"}`}
                >
                  <td className="p-4">
                    <p
                      className={`font-black text-sm uppercase line-clamp-1 ${customer.is_banned ? "text-red-400 line-through" : "text-white"}`}
                    >
                      {customer.name}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">
                      ID: {customer.id}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-sm text-gray-300">
                      {customer.email}
                    </p>
                    <p className="font-mono text-xs text-blue-400 mt-1">
                      {customer.phone || "Belum diisi"}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-xs text-gray-400 uppercase">
                      {new Date(customer.created_at).toLocaleDateString(
                        "id-ID",
                        { day: "2-digit", month: "long", year: "numeric" },
                      )}
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    {customer.is_banned ? (
                      <span className="px-3 py-1 border-2 border-red-800 bg-red-900 text-red-300 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 w-max mx-auto">
                        <UserX size={12} /> DIBLOKIR
                      </span>
                    ) : (
                      <span className="px-3 py-1 border-2 border-green-800 bg-green-900 text-green-300 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 w-max mx-auto">
                        <CheckCircle size={12} /> AKTIF
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 border-2 border-gray-700 bg-[#0a0a0a] text-white hover:border-white transition-colors"
                        title="Edit Profil"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleBan(customer)}
                        className={`p-2 border-2 transition-colors ${customer.is_banned ? "border-green-700 bg-green-900 text-green-300 hover:border-green-400" : "border-red-700 bg-red-900 text-red-300 hover:border-red-400"}`}
                        title={
                          customer.is_banned ? "Aktifkan Akun" : "Blokir Akun"
                        }
                      >
                        {customer.is_banned ? (
                          <UserCheck size={16} />
                        ) : (
                          <Ban size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL EDIT CUSTOMER */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="bg-[#121212] border-4 border-gray-600 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] relative transform-gpu">
            <div className="p-6 border-b-4 border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
              <h2 className="text-xl font-black uppercase tracking-widest text-white">
                Edit Pelanggan
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 border-2 border-gray-600 hover:border-red-500 hover:text-red-500 transition-colors text-gray-400"
              >
                <X size={20} className="font-black" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      name: e.target.value,
                    })
                  }
                  required
                  className="w-full bg-[#1a1a1a] border-4 border-gray-700 p-3 text-white font-bold focus:border-white focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={editingCustomer.phone}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      phone: e.target.value,
                    })
                  }
                  className="w-full bg-[#1a1a1a] border-4 border-gray-700 p-3 text-white font-mono font-bold focus:border-white focus:outline-none transition-colors"
                  placeholder="Misal: 08123456789"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex justify-center items-center gap-2 py-4 bg-white text-black border-4 border-white font-black uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
