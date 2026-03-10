import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/login", { email, password });

      const token = response.data.token || response.data.access_token;
      const userRole = response.data.user?.role;

      if (userRole && userRole !== "admin") {
        setError("Akses Ditolak: Akun ini bukan administrator.");
        setLoading(false);
        return;
      }

      if (token) {
        localStorage.setItem("admin_token", token);
        navigate("/dashboard");
      } else {
        setError("Token keamanan tidak diterima dari server.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Gagal masuk. Periksa kembali email dan password Anda.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md border-8 border-gray-800 p-8 md:p-10 bg-[#121212] shadow-[12px_12px_0px_0px_rgba(51,51,51,1)]">
        <div className="text-center mb-10 border-b-4 border-gray-800 pb-6">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-white">
            Portal.
          </h1>
          <p className="font-bold uppercase tracking-widest text-gray-500 text-xs mt-2">
            Otoritas Admin Riff Fashion
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border-4 border-red-900 bg-[#1a0505] text-red-500 font-bold uppercase text-xs tracking-widest text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2 text-gray-300">
              Email Akses
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] text-white focus:border-gray-500 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] transition-all font-bold text-sm lowercase placeholder-gray-600"
              placeholder="admin@rifffashion.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2 text-gray-300">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] text-white focus:border-gray-500 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] transition-all font-bold text-sm placeholder-gray-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-8 py-4 border-4 text-sm font-black uppercase tracking-widest transition-all ${
              loading
                ? "border-gray-800 bg-[#1a1a1a] text-gray-600 cursor-not-allowed"
                : "border-white bg-white text-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:bg-transparent hover:text-white hover:-translate-y-1"
            }`}
          >
            {loading ? "Mengautentikasi..." : "Masuk ke Sistem"}
          </button>
        </form>
      </div>
    </div>
  );
}
