import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../api/axios';

export default function AdminRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAdminAuthority = async () => {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const res = await api.get('/user');

        if (res.data.role === 'admin') {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Otoritas ditolak:", error);
        localStorage.removeItem('admin_token');
        setIsAuthenticated(false);
      }
    };

    checkAdminAuthority();
  }, []);

  // --- TAMPILAN LOADING DARK MODE BRUTALIST ---
  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] font-sans">
        <div className="text-xl font-black uppercase tracking-widest animate-pulse border-4 border-gray-700 p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] bg-[#121212] text-white">
          Memeriksa Otoritas...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
