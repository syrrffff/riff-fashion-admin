import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Menu, Store } from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    if (window.confirm("Yakin ingin keluar dari markas?")) {
      localStorage.removeItem('admin_token');
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/store', name: 'Toko', icon: <Store size={20} /> },
    { path: '/products', name: 'Produk', icon: <Package size={20} /> },
    { path: '/orders', name: 'Pesanan', icon: <ShoppingCart size={20} /> },
    { path: '/customers', name: 'Pelanggan', icon: <Users size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden font-sans text-white">

      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#121212] border-r-4 border-gray-800 flex flex-col transition-all duration-300 z-20`}>
        <div className="h-20 border-b-4 border-gray-800 flex items-center justify-center p-4 bg-[#1a1a1a]">
          <h1 className={`font-black uppercase italic tracking-tighter text-white ${isSidebarOpen ? 'text-2xl' : 'text-xs hidden md:block'}`}>
            {isSidebarOpen ? 'RIFF ADMIN.' : 'RIFF.'}
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 p-3 border-2 border-transparent font-bold uppercase tracking-widest text-sm transition-all ${
                  isActive
                  ? 'border-white bg-white text-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] translate-x-1'
                  : 'hover:border-gray-500 hover:bg-[#1a1a1a] text-gray-400 hover:text-white'
                }`}
              >
                {item.icon}
                <span className={`${!isSidebarOpen && 'hidden'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t-4 border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-3 border-2 border-red-900 bg-[#1a0505] text-red-500 font-black uppercase tracking-widest text-sm hover:bg-red-900 hover:text-white transition-colors">
            <LogOut size={20} />
            <span className={`${!isSidebarOpen && 'hidden'}`}>Keluar</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-[#121212] border-b-4 border-gray-800 flex items-center justify-between px-6 z-10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 border-2 border-transparent hover:border-gray-600 hover:bg-[#1a1a1a] transition-colors text-white">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black uppercase tracking-widest text-white">Komandan Utama</p>
              <p className="text-xs font-bold text-gray-500">Super Admin</p>
            </div>
            <div className="w-10 h-10 border-2 border-white bg-white text-black flex items-center justify-center font-black">A</div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0a0a0a] p-6 md:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
