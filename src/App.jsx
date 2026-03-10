import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products"; // <--- 1. Import komponennya di sini
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import StoreSetting from "./pages/StoreSetting";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/store" element={<StoreSetting />} />
            <Route path="/customers" element={<Customers />} />

            {/* 2. Pasang komponen Products di rute ini */}
            <Route path="/products" element={<Products />} />

            <Route path="/orders" element={<Orders />} />
            <Route
              path="/users"
              element={
                <div className="font-black text-2xl uppercase">
                  Halaman Pelanggan Segera Hadir
                </div>
              }
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
