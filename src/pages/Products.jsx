import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Search, ChevronLeft, ChevronRight, Package, Tags, Layers, X, Upload } from 'lucide-react';
import api from '../api/axios';

// Fungsi pintar untuk merakit URL gambar agar tidak ada double slash (//)
const getImageUrl = (path) => {
  if (!path) return null;
  const baseUrl = (import.meta.env.VITE_BASE_URL);
  const cleanPath = path.replace(/^\/+/, '');
  return `${baseUrl}/storage/${cleanPath}`;
};

export default function Products() {
  const [activeTab, setActiveTab] = useState('products');

  // ==========================================
  // STATE: PRODUK
  // ==========================================
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // State untuk Paginasi dari Backend
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [lastProductPage, setLastProductPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [fromProduct, setFromProduct] = useState(0);
  const [toProduct, setToProduct] = useState(0);

  // State Modal Produk
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductId, setEditProductId] = useState(null);

  const initialProductForm = { name: '', description: '', price: '', weight: '', category_id: '', image: null };
  const [productForm, setProductForm] = useState(initialProductForm);
  const [productImagePreview, setProductImagePreview] = useState(null);

  // Varian (Default Kosong)
  const [variants, setVariants] = useState([{ size: '', color: '', stock: '' }]);

  // Galeri
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);
  const [deletedGalleryIds, setDeletedGalleryIds] = useState([]);

  // ==========================================
  // STATE: KATEGORI
  // ==========================================
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // State Modal Kategori
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [editCatId, setEditCatId] = useState(null);
  const [catForm, setCatForm] = useState({ name: '' });

  // ==========================================
  // LIFECYCLE & EFFECT
  // ==========================================
  useEffect(() => {
    if (activeTab === 'products') fetchProducts(currentProductPage);
    fetchCategories();
  }, [activeTab, currentProductPage]); // Re-fetch saat halaman berubah

  useEffect(() => {
    if (isProductModalOpen || isCatModalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isProductModalOpen, isCatModalOpen]);

  // Reset ke halaman 1 saat user mengetik di kolom pencarian
  useEffect(() => { setCurrentProductPage(1); }, [searchProductQuery]);

  useEffect(() => {
    if (!isProductModalOpen) {
      if (productImagePreview && !productImagePreview.startsWith('http')) URL.revokeObjectURL(productImagePreview);
      galleryFiles.forEach(gf => URL.revokeObjectURL(gf.previewUrl));
    }
  }, [isProductModalOpen]);


  // ==========================================
  // FETCH DATA
  // ==========================================
  const fetchProducts = async (page = 1) => {
    setLoadingProducts(true);
    try {
      // Menambahkan param page untuk paginasi backend
      const res = await api.get(`/productData?page=${page}`);

      // LOGIKA ANTI-OOM: Jika response dalam bentuk paginasi Laravel
      if (res.data.data && res.data.data.data) {
        setProducts(res.data.data.data);
        setLastProductPage(res.data.data.last_page);
        setTotalProducts(res.data.data.total);
        setFromProduct(res.data.data.from);
        setToProduct(res.data.data.to);
      } else {
        // Fallback jika API mengembalikan array biasa
        setProducts(res.data.data || res.data);
      }
    } catch (error) {
      console.error("Gagal mengambil produk:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || res.data);
    } catch (error) {
      console.error("Gagal mengambil kategori:", error);
    } finally {
      setLoadingCategories(false);
    }
  };


  // ==========================================
  // HANDLER: KATEGORI
  // ==========================================
  const openAddCatModal = () => {
    setIsEditingCat(false);
    setEditCatId(null);
    setCatForm({ name: '' });
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (cat) => {
    setIsEditingCat(true);
    setEditCatId(cat.id);
    setCatForm({ name: cat.name });
    setIsCatModalOpen(true);
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm("Hapus kategori ini? (Pastikan tidak ada produk yang memakainya)")) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menghapus kategori.");
    }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingCat(true);
    try {
      if (isEditingCat) {
        await api.put(`/categories/${editCatId}`, catForm);
      } else {
        await api.post('/categories', catForm);
      }
      setIsCatModalOpen(false);
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmittingCat(false);
    }
  };


  // ==========================================
  // HANDLER: PRODUK
  // ==========================================
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("PERINGATAN: Seluruh data produk, varian, dan galeri akan musnah. Yakin?")) return;
    try {
      await api.delete(`/productData/${id}`);
      fetchProducts(currentProductPage);
    } catch (error) {
      console.error("Gagal menghapus:", error);
    }
  };

  const openAddProductModal = () => {
    setIsEditingProduct(false);
    setEditProductId(null);
    setProductForm(initialProductForm);
    setProductImagePreview(null);
    setVariants([{ size: '', color: '', stock: '' }]);
    setGalleryFiles([]);
    setExistingGallery([]);
    setDeletedGalleryIds([]);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setIsEditingProduct(true);
    setEditProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      weight: product.weight || '',
      category_id: product.category_id || '',
      image: null
    });

    setProductImagePreview(getImageUrl(product.image_url));

    setVariants(product.variants?.length > 0 ? product.variants : [{ size: '', color: '', stock: '' }]);
    setExistingGallery(product.images || []);
    setGalleryFiles([]);
    setDeletedGalleryIds([]);
    setIsProductModalOpen(true);
  };

  const handleProductInputChange = (e) => setProductForm({ ...productForm, [e.target.name]: e.target.value });

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductForm({ ...productForm, image: file });
      setProductImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };
  const addVariant = () => setVariants([...variants, { size: '', color: '', stock: '' }]);
  const removeVariant = (index) => {
    if (variants.length === 1) return alert("Minimal harus ada 1 varian produk!");
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    const newGalleryItems = files.map(file => ({
      file: file,
      previewUrl: URL.createObjectURL(file)
    }));
    setGalleryFiles([...galleryFiles, ...newGalleryItems]);
  };

  const removeNewGalleryFile = (index) => {
    const item = galleryFiles[index];
    URL.revokeObjectURL(item.previewUrl);
    setGalleryFiles(galleryFiles.filter((_, i) => i !== index));
  };

  const removeExistingGalleryImage = (id) => {
    setExistingGallery(existingGallery.filter(img => img.id !== id));
    setDeletedGalleryIds([...deletedGalleryIds, id]);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingProduct(true);

    const data = new FormData();
    data.append('name', productForm.name);
    data.append('description', productForm.description);
    data.append('price', productForm.price);
    data.append('weight', productForm.weight);
    if (productForm.category_id) data.append('category_id', productForm.category_id);
    if (productForm.image) data.append('image', productForm.image);

    const filledVariants = variants.filter(v => v.size !== '' && v.color !== '' && v.stock !== '');
    if(filledVariants.length === 0) {
      alert("Harap isi setidaknya satu varian produk dengan lengkap (Ukuran, Warna, Stok)!");
      setIsSubmittingProduct(false);
      return;
    }
    data.append('variants', JSON.stringify(filledVariants));

    galleryFiles.forEach((gf) => {
      data.append('gallery_images[]', gf.file);
    });

    try {
      if (isEditingProduct) {
        data.append('_method', 'PUT');
        data.append('deleted_images', JSON.stringify(deletedGalleryIds));
        await api.post(`/productData/${editProductId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Produk berhasil diperbarui!');
      } else {
        await api.post('/productData', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Produk Baru siap dijual!');
      }
      setIsProductModalOpen(false);
      fetchProducts(currentProductPage);
    } catch (error) {
      alert(error.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Filter pencarian untuk data yang SEDANG tampil di tabel
  const displayProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) || (p.category?.name || '').toLowerCase().includes(searchProductQuery.toLowerCase())
  );


  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto relative text-white font-sans">
      <div className="border-b-4 border-gray-800 pb-4 mb-6">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
          Katalog.
        </h1>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">
          Pusat Kontrol Riff Fashion
        </p>
      </div>

      {/* NAVIGASI TABS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-6 py-3 border-4 font-black uppercase tracking-widest transition-all ${activeTab === "products" ? "border-white bg-white text-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] translate-x-1" : "border-gray-800 bg-[#121212] text-gray-500 hover:text-white hover:border-gray-600"}`}
        >
          <Package size={18} /> Produk
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-6 py-3 border-4 font-black uppercase tracking-widest transition-all ${activeTab === "categories" ? "border-white bg-white text-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] translate-x-1" : "border-gray-800 bg-[#121212] text-gray-500 hover:text-white hover:border-gray-600"}`}
        >
          <Tags size={18} /> Kategori
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB KONTEN: PRODUK */}
      {/* ========================================== */}
      {activeTab === "products" && (
        <div className="animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-1/2 lg:w-1/3">
              <input
                type="text"
                placeholder="Cari nama atau kategori..."
                className="w-full pl-12 pr-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] focus:border-gray-500 focus:outline-none transition-all font-bold text-sm uppercase text-white placeholder:normal-case placeholder:text-gray-600"
                value={searchProductQuery}
                onChange={(e) => setSearchProductQuery(e.target.value)}
              />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                size={20}
              />
            </div>
            <button
              onClick={openAddProductModal}
              className="flex items-center justify-center gap-2 bg-white text-black px-8 py-3 border-4 border-white font-black uppercase tracking-widest hover:bg-transparent hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:translate-y-1 hover:shadow-none"
            >
              <Plus size={20} /> Tambah Produk
            </button>
          </div>

          <div className="bg-[#121212] border-4 border-gray-800 shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] overflow-x-auto">
            {loadingProducts ? (
              <div className="p-10 text-center font-black uppercase tracking-widest animate-pulse border-b-4 border-gray-800 text-gray-500">
                Memuat Produk...
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="p-10 text-center font-bold uppercase tracking-widest text-gray-500 border-b-4 border-gray-800">
                Tidak ada produk ditemukan.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px] border-b-4 border-gray-800">
                <thead>
                  <tr className="bg-[#1a1a1a] text-gray-300 uppercase text-xs tracking-widest border-b-4 border-gray-800">
                    <th className="p-4 font-black">Info Produk</th>
                    <th className="p-4 font-black w-40">Kategori</th>
                    <th className="p-4 font-black w-40">Harga</th>
                    <th className="p-4 font-black w-24 text-center">Stok</th>
                    <th className="p-4 font-black w-32 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {displayProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b-2 border-gray-800 hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-[#0a0a0a] border-2 border-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {product.image_url ? (
                              <img
                                src={getImageUrl(product.image_url)}
                                alt={product.name}
                                className="w-full h-full object-cover opacity-90 hover:opacity-100"
                              />
                            ) : (
                              <ImageIcon size={24} className="text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase text-white">
                              {product.name}
                            </p>
                            <p className="text-xs font-bold text-gray-500 mt-1">
                              {product.variants?.length || 0} Varian |{" "}
                              {product.weight}g
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-[#1a1a1a] px-3 py-1 border-2 border-gray-700 text-xs font-bold uppercase tracking-widest text-gray-300">
                          {product.category?.name || "UMUM"}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-black text-sm text-gray-200">
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(product.price)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-black text-base ${product.stock < 5 ? "text-red-500" : "text-green-500"}`}
                        >
                          {product.stock !== undefined ? product.stock : "?"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditProductModal(product)}
                            className="p-2 border-2 border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-white hover:text-white transition-colors"
                            title="Edit Produk"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 border-2 border-red-900 bg-[#1a0505] text-red-500 hover:bg-red-900 hover:text-white transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Paginasi Produk (Backend Mode) */}
            {!loadingProducts && totalProducts > 0 && (
              <div className="flex items-center justify-between p-4 bg-[#121212]">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 hidden md:block">
                  Menampilkan {fromProduct}-{toProduct} dari {totalProducts}{" "}
                  Produk
                </span>
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                  <button
                    onClick={() =>
                      setCurrentProductPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentProductPage === 1}
                    className="p-2 border-2 border-gray-700 bg-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed hover:border-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-mono font-black text-sm px-4 text-gray-400">
                    HAL {currentProductPage} / {lastProductPage}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentProductPage((prev) =>
                        Math.min(prev + 1, lastProductPage),
                      )
                    }
                    disabled={currentProductPage === lastProductPage}
                    className="p-2 border-2 border-gray-700 bg-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed hover:border-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB KONTEN: KATEGORI (TADI HILANG)         */}
      {/* ========================================== */}
      {activeTab === "categories" && (
        <div className="animate-fade-in">
          <div className="flex justify-end mb-6">
            <button
              onClick={openAddCatModal}
              className="flex items-center justify-center gap-2 bg-white text-black px-8 py-3 border-4 border-white font-black uppercase tracking-widest hover:bg-transparent hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:translate-y-1 hover:shadow-none"
            >
              <Plus size={20} /> Tambah Kategori
            </button>
          </div>

          <div className="bg-[#121212] border-4 border-gray-800 shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] overflow-x-auto">
            {loadingCategories ? (
               <div className="p-10 text-center font-black uppercase tracking-widest animate-pulse border-b-4 border-gray-800 text-gray-500">
                 Memuat Kategori...
               </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#1a1a1a] text-gray-300 uppercase text-xs tracking-widest border-b-4 border-gray-800">
                    <th className="p-4 font-black">Nama Kategori</th>
                    <th className="p-4 font-black w-32 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b-2 border-gray-800 hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4 font-black text-sm uppercase text-white">{cat.name}</td>
                      <td className="p-4 text-center flex justify-center gap-2">
                        <button
                          onClick={() => openEditCatModal(cat)}
                          className="p-2 border-2 border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-white hover:text-white"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCat(cat.id)}
                          className="p-2 border-2 border-red-900 bg-[#1a0505] text-red-500 hover:bg-red-900 hover:text-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL PRODUK                               */}
      {/* ========================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#121212] border-4 border-gray-800 w-full max-w-4xl p-6 relative my-8">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={28} />
            </button>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-6">
              {isEditingProduct ? "Edit Produk" : "Tambah Produk Baru"}
            </h2>

            {/* Silakan masukkan Form Produk asli Anda di sini. Ini contoh placeholder agar Modal bisa di-close. */}
            <form onSubmit={handleProductSubmit}>
              <div className="p-10 border-4 border-dashed border-gray-700 text-center mb-6 text-gray-500 font-bold uppercase tracking-widest">
                [ Area Form Input Produk Anda ]
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-6 py-3 border-4 border-gray-800 font-black uppercase tracking-widest hover:border-white transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-6 py-3 border-4 border-white bg-white text-black font-black uppercase tracking-widest hover:bg-transparent hover:text-white transition-all disabled:opacity-50"
                >
                  {isSubmittingProduct ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL KATEGORI                             */}
      {/* ========================================== */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border-4 border-gray-800 w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsCatModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={28} />
            </button>
            <h2 className="text-xl font-black uppercase tracking-widest mb-6">
              {isEditingCat ? "Edit Kategori" : "Kategori Baru"}
            </h2>
            <form onSubmit={handleCatSubmit}>
              <input
                type="text"
                value={catForm.name}
                onChange={(e) => setCatForm({ name: e.target.value })}
                placeholder="NAMA KATEGORI"
                className="w-full px-4 py-3 mb-6 border-4 border-gray-800 bg-[#0a0a0a] focus:border-white focus:outline-none font-bold uppercase text-white"
                required
              />
              <div className="flex justify-end gap-4">
                <button
                  type="submit"
                  disabled={isSubmittingCat}
                  className="px-6 py-3 border-4 border-white bg-white text-black font-black uppercase tracking-widest hover:bg-transparent hover:text-white transition-all w-full"
                >
                  {isSubmittingCat ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
