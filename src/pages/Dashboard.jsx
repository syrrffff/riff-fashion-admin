import { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingBag,
  Truck,
  CheckCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  XCircle,
} from "lucide-react";
import api from "../api/axios";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/ordersData");
      const data = res.data.data || res.data;
      setOrders(data);
    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- SAFEGUARD: Pastikan orders selalu array agar tidak crash ---
  const safeOrders = Array.isArray(orders) ? orders : [];

  // --- PERHITUNGAN STATISTIK E-COMMERCE ---

  // 1. Total Pendapatan (Hanya dari pesanan 'completed')
  const completedOrders = safeOrders.filter(
    (o) => (o.status || "").toLowerCase() === "completed",
  );
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + (Number(order.total_price) || 0),
    0,
  );

  // 2. Metrik Pesanan
  const totalOrdersCount = safeOrders.length;
  const pendingCount = safeOrders.filter((o) =>
    ["pending", "processing", "paid"].includes((o.status || "").toLowerCase()),
  ).length;
  const shippedCount = safeOrders.filter(
    (o) => (o.status || "").toLowerCase() === "shipped",
  ).length;
  const completedCount = completedOrders.length;
  const cancelledCount = safeOrders.filter(
    (o) => (o.status || "").toLowerCase() === "cancelled",
  ).length;

  // 3. Pesanan Terbaru (Ambil 5 teratas)
  const recentOrders = safeOrders.slice(0, 5);

  // --- HELPER UI ---
  const formatRupiah = (angka) => new Intl.NumberFormat("id-ID").format(angka);

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending")
      return (
        <span className="px-2 py-1 bg-yellow-500 text-black text-[10px] font-black uppercase">
          Menunggu
        </span>
      );
    if (s === "processing" || s === "paid")
      return (
        <span className="px-2 py-1 bg-blue-500 text-white text-[10px] font-black uppercase">
          Diproses
        </span>
      );
    if (s === "shipped")
      return (
        <span className="px-2 py-1 bg-purple-500 text-white text-[10px] font-black uppercase">
          Dikirim
        </span>
      );
    if (s === "completed")
      return (
        <span className="px-2 py-1 bg-green-500 text-black text-[10px] font-black uppercase">
          Selesai
        </span>
      );
    if (s === "cancelled")
      return (
        <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-black uppercase">
          Batal
        </span>
      );
    return (
      <span className="px-2 py-1 bg-gray-600 text-white text-[10px] font-black uppercase">
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <Activity size={48} className="animate-pulse mb-4 text-blue-500" />
        <h2 className="text-2xl font-black uppercase tracking-widest animate-pulse">
          Menyinkronkan Data...
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative text-white font-sans">
      {/* HEADER */}
      <div className="border-b-4 border-gray-800 pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
            Dashboard.
          </h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">
            Pusat Informasi & Statistik Penjualan
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Total Transaksi Terekam
          </p>
          <p className="text-2xl font-black font-mono">{totalOrdersCount}</p>
        </div>
      </div>

      {/* KARTU METRIK UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* KARTU PENDAPATAN */}
        <div className="border-4 border-green-600 bg-[#0a0a0a] p-6 shadow-[8px_8px_0px_0px_rgba(22,163,74,0.3)] flex flex-col justify-between transform transition-transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-green-500">
                Total Pendapatan Bersih
              </p>
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase">
                Hanya dari pesanan selesai
              </p>
            </div>
            <div className="p-3 bg-green-900 border-2 border-green-500 text-green-400">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-4xl md:text-5xl font-mono font-black text-green-400 tracking-tighter">
            Rp {formatRupiah(totalRevenue)}
          </p>
        </div>

        {/* KARTU TOTAL PESANAN */}
        <div className="border-4 border-gray-800 bg-[#0a0a0a] p-6 shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] flex flex-col justify-between transform transition-transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-400">
                Semua Pesanan
              </p>
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase">
                Total order masuk
              </p>
            </div>
            <div className="p-3 bg-gray-800 border-2 border-gray-600 text-gray-300">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-4xl md:text-5xl font-mono font-black text-white tracking-tighter">
            {totalOrdersCount}{" "}
            <span className="text-xl text-gray-600">Order</span>
          </p>
        </div>

        {/* KARTU PESANAN AKTIF */}
        <div className="border-4 border-blue-600 bg-[#0a0a0a] p-6 shadow-[8px_8px_0px_0px_rgba(37,99,235,0.3)] flex flex-col justify-between transform transition-transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-blue-500">
                Perlu Tindakan
              </p>
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase">
                Menunggu & Diproses
              </p>
            </div>
            <div className="p-3 bg-blue-900 border-2 border-blue-500 text-blue-400">
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="text-4xl md:text-5xl font-mono font-black text-blue-400 tracking-tighter">
            {pendingCount} <span className="text-xl text-blue-800">Paket</span>
          </p>
        </div>
      </div>

      {/* GRID BAWAH: STATUS & PESANAN TERBARU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: STATUS PESANAN */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-black uppercase tracking-widest border-b-4 border-gray-800 pb-2 flex items-center gap-2">
            <Activity size={20} /> Status Logistik
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 border-4 border-gray-800 bg-[#121212] hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-3">
                <Clock className="text-yellow-500" size={24} />
                <span className="font-bold uppercase tracking-widest text-sm text-gray-300">
                  Menunggu/Proses
                </span>
              </div>
              <span className="font-mono font-black text-xl text-white">
                {pendingCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border-4 border-gray-800 bg-[#121212] hover:border-purple-500 transition-colors">
              <div className="flex items-center gap-3">
                <Truck className="text-purple-500" size={24} />
                <span className="font-bold uppercase tracking-widest text-sm text-gray-300">
                  Dalam Pengiriman
                </span>
              </div>
              <span className="font-mono font-black text-xl text-white">
                {shippedCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border-4 border-gray-800 bg-[#121212] hover:border-green-500 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <span className="font-bold uppercase tracking-widest text-sm text-gray-300">
                  Selesai
                </span>
              </div>
              <span className="font-mono font-black text-xl text-white">
                {completedCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border-4 border-gray-800 bg-[#121212] hover:border-red-600 transition-colors">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-600" size={24} />
                <span className="font-bold uppercase tracking-widest text-sm text-gray-300">
                  Dibatalkan
                </span>
              </div>
              <span className="font-mono font-black text-xl text-white">
                {cancelledCount}
              </span>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: TABEL PESANAN TERBARU */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-black uppercase tracking-widest border-b-4 border-gray-800 pb-2 flex items-center gap-2 mb-6">
            <TrendingUp size={20} /> Transaksi Terbaru
          </h2>

          <div className="bg-[#121212] border-4 border-gray-800 shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#1a1a1a] text-gray-400 uppercase text-xs tracking-widest border-b-4 border-gray-800">
                    <th className="p-4 font-black">Pelanggan</th>
                    <th className="p-4 font-black">Nominal</th>
                    <th className="p-4 font-black">Waktu</th>
                    <th className="p-4 font-black text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-8 text-center font-bold text-gray-500 uppercase tracking-widest"
                      >
                        Belum ada transaksi terekam.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b-2 border-gray-800 hover:bg-[#1a1a1a] transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-black text-sm uppercase text-white line-clamp-1">
                            {order.recipient_name ||
                              order.user?.name ||
                              "Pelanggan"}
                          </p>
                          <p className="font-mono text-[10px] text-gray-500 mt-1">
                            {order.order_number}
                          </p>
                        </td>
                        <td className="p-4 font-mono font-black text-sm text-green-400">
                          Rp {formatRupiah(order.grand_total)}
                        </td>
                        <td className="p-4 font-mono text-xs font-bold text-gray-400">
                          {new Date(order.created_at).toLocaleDateString(
                            "id-ID",
                            { day: "2-digit", month: "short" },
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
