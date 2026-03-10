import { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  XCircle,
  MapPin,
  Loader2,
  User,
  Printer,
} from "lucide-react";
import api from "../api/axios";

export default function Orders() {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- PENCARIAN & PAGINASI ---
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- STATE MODAL DETAIL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // --- STATE MODAL TRACKING KHUSUS ---
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (isModalOpen || isTrackingModalOpen)
      document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isTrackingModalOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ordersData");
      setOrders(res.data.data || res.data);
    } catch (error) {
      console.error("Gagal mengambil data pesanan:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // --- FUNGSI TRACKING BITESHIP ---
  const handleTrackPackage = async (order) => {
    if (!order.tracking_number && !order.biteship_order_id) {
      return alert("Resi belum tersedia untuk pesanan ini.");
    }
    setIsTrackingModalOpen(true);
    setIsTrackingLoading(true);
    setTrackingData(null);
    try {
      const res = await api.get(`/ordersTracking/${order.id}/track`);
      const trackResult = res.data;
      setTrackingData({
        courier:
          order.courier_company ||
          trackResult.courier?.company ||
          "Kurir Ekspedisi",
        tracking_number: order.tracking_number || trackResult.waybill_id || "-",
        status: trackResult.status || "Dilacak",
        history: trackResult.history || [],
      });
    } catch (error) {
      console.error("Tracking Error:", error);
      alert(
        error.response?.data?.message ||
          "Gagal melacak resi. Pastikan Anda mengklik pesanan yang benar.",
      );
      setIsTrackingModalOpen(false);
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // --- JURUS BARU: CETAK RESI & UBAH STATUS ---
  const handlePrintAndShip = async (order) => {
    // 1. Dapatkan info alamat yang akurat
    const addrInfo = getOrderAddressInfo(order);

    // 2. Tembak API untuk ubah status jadi 'shipped' (Dikirim)
    try {
      // Endpoint ini asusmsi. Jika belum ada di Laravel, kita harus buat (lihat instruksi di bawah)
      await api.put(`/ordersData/${order.id}/ship`, { status: "shipped" });

      // 3. Generate Jendela Print HTML (Murni Frontend, sangat cepat)
      const printWindow = window.open("", "_blank", "width=800,height=600");

      const itemsHtml = order.items
        ?.map((i) => {
          const v = i.product_variant || i.productVariant;
          const name = v?.product?.name || "Produk";
          const size = v?.size || "-";
          const color = v?.color || "-";
          return `<li style="margin-bottom: 5px;"><strong>${i.quantity}x</strong> ${name} (Var: ${size}, ${color})</li>`;
        })
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cetak Resi - ${order.order_number}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 20px; font-size: 14px; }
            .label-box { border: 3px dashed #000; padding: 20px; max-width: 500px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: 900; text-transform: uppercase; }
            .courier { font-size: 20px; font-weight: bold; margin-top: 5px; }
            .resi { font-size: 18px; font-weight: bold; background: #000; color: #fff; display: inline-block; padding: 5px 15px; margin-top: 10px;}
            .section { margin-bottom: 20px; border-bottom: 1px dotted #000; padding-bottom: 15px; }
            .section-title { font-weight: bold; text-transform: uppercase; margin-bottom: 5px; text-decoration: underline; }
            ul { margin: 0; padding-left: 20px; }
            .footer { text-align: center; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-top: 20px; }
            @media print {
              body { padding: 0; }
              .label-box { border: 2px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="header">
              <div class="title">LABEL PENGIRIMAN</div>
              <div class="courier">Kurir: ${order.courier_company ? order.courier_company.toUpperCase() : "BELUM DIPILIH"}</div>
              <div class="resi">${order.tracking_number || "RESI BELUM TERSEDIA"}</div>
            </div>

            <div class="section">
              <div class="section-title">PENERIMA:</div>
              <div style="font-size: 18px; font-weight: 900;">${addrInfo.name}</div>
              <div style="font-weight: bold; margin-top: 5px;">${addrInfo.phone}</div>
              <div style="margin-top: 5px;">${addrInfo.fullAddress} ${addrInfo.postalCode}</div>
            </div>

            <div class="section">
              <div class="section-title">PENGIRIM:</div>
              <div style="font-weight: 900;">RIFF FASHION (Toko Anda)</div>
              <div>0812-XXXX-XXXX</div>
            </div>

            <div class="section" style="border-bottom: none;">
              <div class="section-title">RINCIAN BARANG:</div>
              <ul>${itemsHtml}</ul>
            </div>

            <div class="footer">
              TANGGAL CETAK: ${new Date().toLocaleString("id-ID")} <br>
              ${order.order_number}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      // 4. Update data di tabel React tanpa harus nunggu user refresh manual
      fetchOrders();
    } catch (error) {
      console.error("Gagal update status resi:", error);
      alert(
        "Resi gagal dicetak. Pastikan endpoint update status API Anda sudah siap.",
      );
    }
  };

  // --- HELPER UI ---
  const getStatusStyle = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "bg-yellow-500 text-black border-yellow-700";
    if (s === "processing" || s === "paid")
      return "bg-blue-500 text-white border-blue-700";
    if (s === "shipped") return "bg-purple-500 text-white border-purple-700";
    if (s === "completed") return "bg-green-500 text-black border-green-700";
    if (s === "cancelled") return "bg-red-600 text-white border-red-800";
    return "bg-gray-800 text-gray-300 border-gray-600";
  };

  const formatStatusIndo = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "Menunggu";
    if (s === "processing" || s === "paid") return "Dibayar"; // Kita singkat jadi Dibayar
    if (s === "shipped") return "Dikirim";
    if (s === "completed") return "Selesai";
    if (s === "cancelled") return "Dibatalkan";
    return status;
  };

  const getTabCount = (tabId) => {
    if (tabId === "all") return orders.length;
    return orders.filter((o) => {
      const s = (o.status || "").toLowerCase();
      if (tabId === "paid") return s === "processing" || s === "paid";
      return s === tabId;
    }).length;
  };

  const getOrderAddressInfo = (order) => {
    if (!order) return {};
    return {
      name: order.recipient_name || order.user?.name || "Pelanggan",
      phone: order.phone_number || "-",
      fullAddress: order.shipping_address || "Alamat tidak tersedia.",
      postalCode: "",
    };
  };

  let filteredOrders = orders.filter(
    (o) =>
      (o.order_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (o.tracking_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  if (activeTab !== "all") {
    filteredOrders = filteredOrders.filter((o) => {
      const s = (o.status || "").toLowerCase();
      if (activeTab === "paid") return s === "processing" || s === "paid";
      return s === activeTab;
    });
  }

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="max-w-7xl mx-auto relative text-white font-sans">
      {/* HEADER & TABS */}
      <div className="border-b-4 border-gray-800 pb-4 mb-6">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
          Pesanan.
        </h1>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">
          Pusat Logistik & Pemantauan Otomatis
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 border-b-4 border-gray-800 pb-6">
        {[
          { id: "all", label: "Semua", icon: <Package size={18} /> },
          {
            id: "pending",
            label: "Menunggu",
            icon: <AlertTriangle size={18} />,
          },
          { id: "paid", label: "Perlu Dikirim", icon: <Clock size={18} /> }, // Label tab diubah biar lebih jelas fungsinya
          { id: "shipped", label: "Dikirim", icon: <Truck size={18} /> },
          {
            id: "completed",
            label: "Selesai",
            icon: <CheckCircle size={18} />,
          },
          { id: "cancelled", label: "Batal", icon: <XCircle size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-4 font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "border-white bg-white text-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] translate-x-1" : "border-gray-800 bg-[#121212] text-gray-500 hover:text-white hover:border-gray-600"}`}
          >
            {tab.icon} {tab.label}
            <span
              className={`ml-2 px-2 py-0.5 text-[11px] border-2 ${activeTab === tab.id ? "border-black bg-black text-white" : "border-gray-600 bg-[#0a0a0a] text-gray-400"}`}
            >
              {getTabCount(tab.id)}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="relative w-full md:w-1/2">
          <input
            type="text"
            placeholder="Cari No. Order atau Resi..."
            className="w-full pl-12 pr-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] focus:border-gray-500 focus:outline-none transition-all font-bold text-sm uppercase text-white placeholder:normal-case placeholder:text-gray-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
            size={20}
          />
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-[#121212] border-4 border-gray-800 shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center font-black uppercase tracking-widest animate-pulse border-b-4 border-gray-800 text-gray-500">
            Memuat Data Transaksi...
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="p-10 text-center font-bold uppercase tracking-widest text-gray-500 border-b-4 border-gray-800">
            Tidak ada pesanan ditemukan.
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px] border-b-4 border-gray-800">
            <thead>
              <tr className="bg-[#1a1a1a] text-gray-300 uppercase text-xs tracking-widest border-b-4 border-gray-800">
                <th className="p-4 font-black">Penerima & Tanggal</th>
                <th className="p-4 font-black">Kurir & Resi</th>
                <th className="p-4 font-black">Pembayaran</th>
                <th className="p-4 font-black">Total (Rp)</th>
                <th className="p-4 font-black text-center">Status</th>
                <th className="p-4 font-black text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const addrInfo = getOrderAddressInfo(order);
                const isReadyToShip =
                  order.status === "paid" || order.status === "processing"; // Target tombol cetak

                return (
                  <tr
                    key={order.id}
                    className="border-b-2 border-gray-800 hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-black text-sm uppercase text-white line-clamp-1">
                        {addrInfo.name}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleString("id-ID")}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-sm text-gray-300 uppercase">
                        {order.courier_company || "-"}
                      </p>
                      <p className="font-mono text-xs text-blue-400 mt-1">
                        {order.tracking_number || "Belum ada resi"}
                      </p>
                    </td>
                    <td className="p-4 font-bold text-xs text-gray-400 uppercase">
                      {order.payment_type || "Belum Pilih"}
                    </td>
                    <td className="p-4 font-mono font-black text-sm text-white">
                      {new Intl.NumberFormat("id-ID").format(order.grand_total)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 border-2 text-[10px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}
                      >
                        {formatStatusIndo(order.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDetailModal(order)}
                          className="p-2 border-2 border-gray-700 bg-[#0a0a0a] text-white hover:border-white transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>

                        {/* TOMBOL CETAK RESI (Hanya muncul jika status Paid / Processing) */}
                        {isReadyToShip && (
                          <button
                            onClick={() => handlePrintAndShip(order)}
                            className="p-2 border-2 border-blue-700 bg-blue-900 text-white hover:bg-blue-600 hover:border-blue-400 transition-colors flex items-center gap-1"
                            title="Cetak Resi & Pindahkan ke Dikirim"
                          >
                            <Printer size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* PAGINASI */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-[#121212]">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 hidden md:block">
              Hal {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border-2 border-gray-700 bg-[#0a0a0a] hover:border-white disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 border-2 border-gray-700 bg-[#0a0a0a] hover:border-white disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: PEMANTAUAN PESANAN (READ ONLY) */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/90">
          <div className="bg-[#121212] border-4 border-gray-600 w-full max-w-4xl max-h-[90vh] overflow-y-auto overscroll-contain shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] relative custom-scrollbar transform-gpu">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-[#0a0a0a] border-2 border-gray-600 hover:border-red-500 hover:text-red-500 transition-colors z-20"
            >
              <X size={24} className="font-black" />
            </button>

            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-gray-800 pb-6 mb-8 gap-4">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                    ORDER: {selectedOrder.order_number}
                  </h2>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                    Midtrans ID: {selectedOrder.midtrans_transaction_id || "-"}
                  </p>
                </div>
                <div>
                  <span
                    className={`px-4 py-2 border-2 text-sm font-black uppercase tracking-widest ${getStatusStyle(selectedOrder.status)}`}
                  >
                    Status: {formatStatusIndo(selectedOrder.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                <div className="md:col-span-1 space-y-6">
                  {/* INFO PENERIMA MENGGUNAKAN DATA ALAMAT DATABASE */}
                  <div className="border-4 border-gray-800 p-6 bg-[#0a0a0a] flex flex-col">
                    <div className="flex items-center gap-2 border-b-2 border-gray-800 pb-2 mb-4">
                      <User size={16} className="text-gray-400" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                        Penerima
                      </h3>
                    </div>
                    {(() => {
                      const addrInfo = getOrderAddressInfo(selectedOrder);
                      return (
                        <>
                          <p className="font-black text-white uppercase text-lg line-clamp-2 leading-tight">
                            {addrInfo.name}
                          </p>
                          <p className="text-xs font-mono font-bold text-blue-400 mt-1 border-b-2 border-gray-800 pb-2 mb-2">
                            {addrInfo.phone}
                          </p>
                          <p className="text-xs font-bold text-gray-400 leading-relaxed">
                            {addrInfo.fullAddress}{" "}
                            {addrInfo.postalCode
                              ? ` - ${addrInfo.postalCode}`
                              : ""}
                          </p>
                        </>
                      );
                    })()}
                  </div>

                  {/* INFO LOGISTIK */}
                  <div className="border-4 border-gray-800 p-6 bg-[#0a0a0a] flex flex-col h-full">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 border-b-2 border-gray-800 pb-2 mb-4">
                      Pengiriman (Biteship)
                    </h3>
                    <p className="font-black text-white uppercase text-xl">
                      {selectedOrder.courier_company || "Belum Terjadwal"}
                    </p>
                    <p className="font-mono text-blue-400 font-bold mt-2 text-sm break-all">
                      Resi: {selectedOrder.tracking_number || "-"}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 mt-1 mb-4">
                      Biteship ID: {selectedOrder.biteship_order_id || "-"}
                    </p>

                    <div className="mt-auto pt-4 border-t-2 border-gray-800">
                      <button
                        onClick={() => handleTrackPackage(selectedOrder)}
                        disabled={
                          !selectedOrder.tracking_number &&
                          !selectedOrder.biteship_order_id
                        }
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-4 border-blue-700 bg-[#0a0a0a] text-blue-400 font-black uppercase tracking-widest hover:bg-blue-900 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MapPin size={16} /> Lacak Perjalanan
                      </button>
                    </div>
                  </div>
                </div>

                {/* DAFTAR BARANG */}
                <div className="md:col-span-2 border-4 border-gray-800 bg-[#0a0a0a] overflow-hidden flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 border-b-4 border-gray-800 p-4 bg-[#121212]">
                    Rincian Barang
                  </h3>
                  <div className="p-4 flex-grow overflow-y-auto">
                    {selectedOrder.items?.map((item) => {
                      const variantObj =
                        item.product_variant || item.productVariant;
                      const productName =
                        variantObj?.product?.name ||
                        "Nama Produk Tidak Diketahui";
                      const size = variantObj?.size || "-";
                      const color = variantObj?.color || "-";

                      return (
                        <div
                          key={item.id}
                          className="flex justify-between items-center border-b-2 border-gray-800 py-3 last:border-0"
                        >
                          <div>
                            <p className="font-black text-sm uppercase text-white">
                              {productName}
                            </p>
                            <p className="text-xs font-bold text-gray-500 mt-1">
                              Var: {size}{" "}
                              {color !== "-" && color !== "Default"
                                ? `- ${color}`
                                : ""}{" "}
                              | Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-mono font-black text-sm text-white">
                            Rp{" "}
                            {new Intl.NumberFormat("id-ID").format(
                              item.price * item.quantity,
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t-4 border-gray-800 p-4 bg-[#121212] space-y-2 mt-auto">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <p>Subtotal</p>
                      <p>
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          selectedOrder.total_price,
                        )}
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <p>Ongkos Kirim</p>
                      <p>
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          selectedOrder.shipping_cost,
                        )}
                      </p>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-gray-800 pt-2 mt-2">
                      <p className="font-black text-sm uppercase tracking-widest text-white">
                        Grand Total
                      </p>
                      <p className="font-mono font-black text-xl text-green-400">
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          selectedOrder.grand_total,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PELACAKAN RESI (TRACKING) TIMELINE */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
          <div className="bg-[#121212] border-4 border-blue-600 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_rgba(37,99,235,0.3)] relative transform-gpu">
            <div className="p-6 border-b-4 border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
              <div className="flex items-center gap-3 text-blue-400">
                <MapPin size={28} />
                <div>
                  <h2 className="text-xl font-black uppercase tracking-widest">
                    Live Tracking
                  </h2>
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    {selectedOrder?.order_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTrackingModalOpen(false)}
                className="p-2 border-2 border-gray-600 hover:border-red-500 hover:text-red-500 transition-colors text-gray-400"
              >
                <X size={20} className="font-black" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar relative flex-grow">
              {isTrackingLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-blue-500">
                  <Loader2 size={48} className="animate-spin mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm animate-pulse">
                    Menghubungi Satelit Logistik...
                  </p>
                </div>
              ) : trackingData ? (
                <div>
                  <div className="mb-8 p-4 border-2 border-blue-900 bg-[#0a0a0a]">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Kurir & Resi
                    </p>
                    <p className="text-lg font-black text-white uppercase">
                      {trackingData.courier} -{" "}
                      <span className="text-blue-400 font-mono">
                        {trackingData.tracking_number}
                      </span>
                    </p>
                  </div>

                  <div className="pl-4">
                    {trackingData.history.length === 0 ? (
                      <p className="text-gray-500 font-bold uppercase text-sm">
                        Belum ada riwayat perjalanan dari pihak ekspedisi.
                      </p>
                    ) : (
                      trackingData.history.map((hist, idx) => (
                        <div
                          key={idx}
                          className="relative pl-8 pb-8 border-l-4 border-gray-800 last:border-0 last:pb-0 group"
                        >
                          <div
                            className={`absolute left-[-11px] top-0 w-5 h-5 rounded-full border-4 border-[#121212] ${idx === 0 ? "bg-blue-500 animate-pulse" : "bg-gray-600"}`}
                          ></div>
                          <div className="-mt-1">
                            <p
                              className={`text-xs font-mono font-bold mb-1 ${idx === 0 ? "text-blue-400" : "text-gray-500"}`}
                            >
                              {new Date(
                                hist.updated_at || hist.date || hist.created_at,
                              ).toLocaleString("id-ID")}
                            </p>
                            <p
                              className={`text-sm font-black uppercase tracking-wide ${idx === 0 ? "text-white" : "text-gray-400"}`}
                            >
                              {hist.note ||
                                hist.description ||
                                "Status Diperbarui"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-red-500 font-bold uppercase">
                  Gagal Memuat Data Lacak.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
