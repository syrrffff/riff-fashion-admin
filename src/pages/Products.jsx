import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Search, ChevronLeft, ChevronRight, Package, Tags, X, Upload } from 'lucide-react';
import api from '../api/axios';

const getImageUrl = (path) => {
  if (!path) return null;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const cleanPath = path.replace(/^\/+/, '');
  return `${baseUrl}/storage/${cleanPath}`;
};

export default function Products() {
  const [activeTab, setActiveTab] = useState('products');

  // ==========================================
  // STATE: PRODUK & PAGINATION FRONTEND
  // ==========================================
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchProductQuery, setSearchProductQuery] = useState('');

  const [currentProductPage, setCurrentProductPage] = useState(1);
  const itemsPerPage = 10; // Tampilkan 10 data per halaman

  // ==========================================
  // STATE: MODAL PRODUK
  // ==========================================
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [imageError, setImageError] = useState("");

  const initialProductForm = { name: '', description: '', price: '', weight: '', category_id: '', image: null };
  const [productForm, setProductForm] = useState(initialProductForm);
  const [productImagePreview, setProductImagePreview] = useState(null);

  const [variants, setVariants] = useState([{ size: '', color: '', stock: '' }]);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);
  const [deletedGalleryIds, setDeletedGalleryIds] = useState([]);

  // ==========================================
  // STATE: KATEGORI
  // ==========================================
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [editCatId, setEditCatId] = useState(null);
  const [catForm, setCatForm] = useState({ name: '' });

  // ==========================================
  // LIFECYCLE
  // ==========================================
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
        fetchProducts(); // Tarik semua data sekaligus
    }
  }, [activeTab]);

  useEffect(() => { setCurrentProductPage(1); }, [searchProductQuery]); // Reset ke hal 1 jika mencari

  useEffect(() => {
    if (!isProductModalOpen) {
      if (productImagePreview && !productImagePreview.startsWith('http')) URL.revokeObjectURL(productImagePreview);
      galleryFiles.forEach(gf => URL.revokeObjectURL(gf.previewUrl));
    }
  }, [isProductModalOpen]);

  // ==========================================
  // FETCH DATA
  // ==========================================
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get(`/productData`);
      const payload = res.data?.data || res.data || [];
      setProducts(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Gagal mengambil produk:", error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get('/categories');
      const payload = res.data?.data?.data || res.data?.data || res.data || [];
      setCategories(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Gagal mengambil kategori:", error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // ==========================================
  // HANDLER: KATEGORI
  // ==========================================
  const openAddCatModal = () => { setIsEditingCat(false); setEditCatId(null); setCatForm({ name: '' }); setIsCatModalOpen(true); };
  const openEditCatModal = (cat) => { setIsEditingCat(true); setEditCatId(cat.id); setCatForm({ name: cat.name }); setIsCatModalOpen(true); };

  const handleDeleteCat = async (id) => {
    if (!window.confirm("Hapus kategori ini?")) return;
    try { await api.delete(`/categories/${id}`); fetchCategories(); }
    catch (error) { alert("Gagal menghapus kategori."); }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingCat(true);
    try {
      if (isEditingCat) await api.put(`/categories/${editCatId}`, catForm);
      else await api.post('/categories', catForm);
      setIsCatModalOpen(false);
      fetchCategories();
    } catch (error) { alert("Terjadi kesalahan."); }
    finally { setIsSubmittingCat(false); }
  };

  // ==========================================
  // HANDLER: PRODUK
  // ==========================================
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("PERINGATAN: Seluruh data produk, varian, dan galeri akan musnah. Yakin?")) return;
    try {
      await api.delete(`/productData/${id}`);
      fetchProducts();
    } catch (error) { console.error("Gagal menghapus:", error); }
  };

  const openAddProductModal = () => {
    setIsEditingProduct(false); setEditProductId(null); setProductForm(initialProductForm);
    setProductImagePreview(null); setVariants([{ size: '', color: '', stock: '' }]);
    setGalleryFiles([]); setExistingGallery([]); setDeletedGalleryIds([]);
    setImageError("");
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setIsEditingProduct(true); setEditProductId(product.id);
    setProductForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        weight: product.weight || '',
        category_id: product.category_id || '',
        image: null
    });
    setProductImagePreview(getImageUrl(product.image_url));
    setVariants(product.variants?.length > 0 ? product.variants : [{ size: '', color: '', stock: '' }]);
    setExistingGallery(product.images || []); setGalleryFiles([]); setDeletedGalleryIds([]);
    setImageError("");
    setIsProductModalOpen(true);
  };

  const handleProductInputChange = (e) => setProductForm({ ...productForm, [e.target.name]: e.target.value });

  const handleProductImageChange = (e) => {
    setImageError("");
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setImageError("UKURAN FOTO UTAMA MELEBIHI BATAS MAKSIMAL 2MB!");
        e.target.value = null;
        return;
      }
      setProductForm({ ...productForm, image: file });
      setProductImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e) => {
    setImageError("");
    const files = Array.from(e.target.files);

    const validFiles = files.filter(file => {
      if (file.size > 2 * 1024 * 1024) {
        setImageError("BEBERAPA FOTO GALERI DITOLAK KARENA MELEBIHI 2MB!");
        return false;
      }
      return true;
    });

    const newGalleryItems = validFiles.map(file => ({
      file: file,
      previewUrl: URL.createObjectURL(file)
    }));

    setGalleryFiles([...galleryFiles, ...newGalleryItems]);
    e.target.value = null;
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants]; newVariants[index][field] = value; setVariants(newVariants);
  };
  const addVariant = () => setVariants([...variants, { size: '', color: '', stock: '' }]);
  const removeVariant = (index) => {
    if (variants.length === 1) return alert("Minimal harus ada 1 varian produk!");
    setVariants(variants.filter((_, i) => i !== index));
  };

  const removeNewGalleryFile = (index) => {
    URL.revokeObjectURL(galleryFiles[index].previewUrl);
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
    data.append('name', productForm.name); data.append('description', productForm.description);
    data.append('price', productForm.price); data.append('weight', productForm.weight);
    if (productForm.category_id) data.append('category_id', productForm.category_id);
    if (productForm.image) data.append('image', productForm.image);

    const filledVariants = variants.filter(v => v.size !== '' && v.color !== '' && v.stock !== '');
    if(filledVariants.length === 0) { alert("Harap isi setidaknya satu varian produk!"); setIsSubmittingProduct(false); return; }
    data.append('variants', JSON.stringify(filledVariants));
    galleryFiles.forEach((gf) => { data.append('gallery_images[]', gf.file); });

    try {
      let response;
      if (isEditingProduct) {
        data.append('_method', 'PUT');
        data.append('deleted_images', JSON.stringify(deletedGalleryIds));
        response = await api.post(`/productData/${editProductId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        response = await api.post('/productData', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      alert(response.data.message || "Produk berhasil dieksekusi!");
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // ==========================================
  // LOGIKA PAGINASI FRONTEND
  // ==========================================
  const filteredProducts = (products || []).filter(p =>
    (p?.name || '').toLowerCase().includes(searchProductQuery.toLowerCase()) ||
    (p?.category?.name || '').toLowerCase().includes(searchProductQuery.toLowerCase())
  );

  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startProductIndex = (currentProductPage - 1) * itemsPerPage;
  const displayProducts = filteredProducts.slice(startProductIndex, startProductIndex + itemsPerPage);

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto relative text-white font-sans">
      <div className="border-b-4 border-gray-800 pb-4 mb-6">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Katalog.</h1>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Pusat Kontrol Riff Fashion</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-6 py-3 border-4 font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'border-white bg-white text-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] translate-x-1' : 'border-gray-800 bg-[#121212] text-gray-500 hover:text-white hover:border-gray-600'}`}><Package size={18} /> Produk</button>
        <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-6 py-3 border-4 font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'border-white bg-white text-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] translate-x-1' : 'border-gray-800 bg-[#121212] text-gray-500 hover:text-white hover:border-gray-600'}`}><Tags size={18} /> Kategori</button>
      </div>

      {/* ========================================== */}
      {/* TAB: PRODUK UTAMA */}
      {/* ========================================== */}
      {activeTab === 'products' && (
        <div className="animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-1/2 lg:w-1/3">
              <input type="text" placeholder="Cari Produk atau Kategori..." className="w-full pl-12 pr-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] focus:border-gray-500 focus:outline-none transition-all font-bold text-sm uppercase text-white placeholder:normal-case placeholder:text-gray-600" value={searchProductQuery} onChange={(e) => setSearchProductQuery(e.target.value)} />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
            </div>
            <button onClick={openAddProductModal} className="flex items-center justify-center gap-2 bg-white text-black px-8 py-3 border-4 border-white font-black uppercase tracking-widest hover:bg-transparent hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:translate-y-1 hover:shadow-none"><Plus size={20} /> Tambah Produk</button>
          </div>

          <div className="bg-[#121212] border-4 border-gray-800 shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] overflow-x-auto">
            {loadingProducts ? (
              <div className="p-10 text-center font-black uppercase tracking-widest animate-pulse border-b-4 border-gray-800 text-gray-500">Memuat Data...</div>
            ) : displayProducts.length === 0 ? (
              <div className="p-10 text-center font-bold uppercase tracking-widest text-gray-500 border-b-4 border-gray-800">Tidak ada produk ditemukan.</div>
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
                    <tr key={product.id} className="border-b-2 border-gray-800 hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-[#0a0a0a] border-2 border-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {product.image_url ? <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover opacity-90 hover:opacity-100" loading="lazy" /> : <ImageIcon size={24} className="text-gray-600" />}
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase text-white">{product.name}</p>
                            <p className="text-xs font-bold text-gray-500 mt-1">{product.variants?.length || 0} Varian | {product.weight}g</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><span className="bg-[#1a1a1a] px-3 py-1 border-2 border-gray-700 text-xs font-bold uppercase tracking-widest text-gray-300">{product.category?.name || 'UMUM'}</span></td>
                      <td className="p-4 font-mono font-black text-sm text-gray-200">Rp {new Intl.NumberFormat('id-ID').format(product.price)}</td>
                      <td className="p-4 text-center"><span className={`font-black text-base ${product.stock < 5 ? 'text-red-500' : 'text-green-500'}`}>{product.stock !== undefined ? product.stock : '?'}</span></td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditProductModal(product)} className="p-2 border-2 border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-white hover:text-white transition-colors" title="Edit Produk"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2 border-2 border-red-900 bg-[#1a0505] text-red-500 hover:bg-red-900 hover:text-white transition-colors" title="Hapus Produk"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* PAGINASI FRONTEND */}
            {!loadingProducts && filteredProducts.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-[#121212]">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 hidden md:block">
                  Menampilkan {startProductIndex + 1}-{Math.min(startProductIndex + itemsPerPage, filteredProducts.length)} dari {filteredProducts.length} Produk
                </span>
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                  <button
                    onClick={() => setCurrentProductPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentProductPage === 1}
                    className="p-2 border-2 border-gray-700 bg-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed hover:border-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-mono font-black text-sm px-4 text-gray-400">HAL {currentProductPage} / {totalProductPages}</span>
                  <button
                    onClick={() => setCurrentProductPage(prev => Math.min(prev + 1, totalProductPages))}
                    disabled={currentProductPage === totalProductPages}
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
      {/* TAB: KATEGORI */}
      {/* ========================================== */}
      {activeTab === 'categories' && (
        <div className="animate-fade-in">
          <div className="flex justify-end mb-6">
            <button onClick={openAddCatModal} className="flex items-center justify-center gap-2 bg-white text-black px-8 py-3 border-4 border-white font-black uppercase tracking-widest hover:bg-transparent hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:translate-y-1 hover:shadow-none"><Plus size={20} /> Tambah Kategori</button>
          </div>

          <div className="bg-[#121212] border-4 border-gray-800 shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] overflow-x-auto">
            {loadingCategories ? (
              <div className="p-10 text-center font-black uppercase tracking-widest animate-pulse border-b-4 border-gray-800 text-gray-500">Memuat Kategori...</div>
            ) : categories.length === 0 ? (
              <div className="p-10 text-center font-bold uppercase tracking-widest text-gray-500 border-b-4 border-gray-800">Belum ada kategori terdaftar.</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[500px] border-b-4 border-gray-800">
                <thead>
                  <tr className="bg-[#1a1a1a] text-gray-300 uppercase text-xs tracking-widest border-b-4 border-gray-800">
                    <th className="p-4 font-black">Nama Kategori</th>
                    <th className="p-4 font-black w-40 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b-2 border-gray-800 hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4 font-black text-white uppercase tracking-widest">{cat.name}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditCatModal(cat)} className="p-2 border-2 border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-white hover:text-white transition-colors"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteCat(cat.id)} className="p-2 border-2 border-red-900 bg-[#1a0505] text-red-500 hover:bg-red-900 hover:text-white transition-colors"><Trash2 size={16} /></button>
                        </div>
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
      {/* MODAL: PRODUK (COMMAND CENTER) */}
      {/* ========================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 overflow-y-auto">
          <div className="bg-[#121212] border-4 border-gray-600 w-full max-w-5xl max-h-[90vh] overflow-y-auto overscroll-contain shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] relative custom-scrollbar transform-gpu my-auto">

            <button onClick={() => { setIsProductModalOpen(false); setImageError(""); }} className="absolute top-4 right-4 p-2 bg-[#0a0a0a] border-2 border-gray-600 hover:border-red-500 hover:text-red-500 transition-colors z-20">
              <X size={24} className="font-black" />
            </button>

            <div className="p-8 md:p-10">
              <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-gray-800 pb-4 mb-8 text-white">
                {isEditingProduct ? 'EDIT PRODUK' : 'TAMBAH PRODUK BARU'}
              </h2>

              {/* NOTIFIKASI ERROR GAMBAR */}
              {imageError && (
                <div className="bg-red-900 text-white font-black uppercase tracking-widest p-4 mb-8 border-4 border-red-500 flex items-center justify-between animate-pulse">
                  <span>{imageError}</span>
                  <button type="button" onClick={() => setImageError("")}><X size={20}/></button>
                </div>
              )}

              <form onSubmit={handleProductSubmit} className="space-y-10">

                {/* 1: MEDIA & FOTO */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-l-4 border-white pl-3">
                    <h3 className="text-xl font-black uppercase tracking-widest text-gray-400">1. Media Etalase</h3>
                    <span className="bg-gray-800 text-gray-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Maksimal 2MB / Foto</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* FOTO UTAMA */}
                    <div className="lg:col-span-1">
                      <label className="block text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Foto Utama (Wajib)</label>
                      <div className={`border-4 border-dashed p-2 bg-[#0a0a0a] transition-colors relative cursor-pointer group flex flex-col items-center justify-center h-80 ${(imageError || "").includes("UTAMA") ? "border-red-500 bg-red-900/20" : "border-gray-800 hover:border-gray-500"}`}>
                        <input type="file" accept="image/*" onChange={handleProductImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="w-full h-full bg-[#121212] flex items-center justify-center overflow-hidden relative">
                          {productImagePreview ? (
                            <img src={productImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-600 group-hover:text-white transition-colors">
                               <ImageIcon size={64} className="mb-4" />
                               <span className="font-black uppercase tracking-widest text-xs text-center px-4">Upload Foto Utama</span>
                            </div>
                          )}
                          {productImagePreview && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={40} className="text-white mb-2" />
                                <span className="font-black uppercase tracking-widest text-xs text-white">Ganti Foto</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* GALERI TAMBAHAN */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Galeri Tambahan (Opsional)</label>
                      <div className={`bg-[#0a0a0a] border-4 p-4 min-h-[20rem] ${(imageError || "").includes("GALERI") ? "border-red-500 bg-red-900/20" : "border-gray-800"}`}>
                          <div className="flex flex-wrap gap-4">
                            <div className="relative w-32 h-32 border-4 border-dashed border-gray-700 hover:border-white bg-[#121212] transition-colors cursor-pointer group flex flex-col items-center justify-center">
                                <input type="file" accept="image/*" multiple onChange={handleGalleryChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                <Plus size={32} className="text-gray-600 group-hover:text-white mb-2" />
                                <span className="font-black uppercase tracking-widest text-[10px] text-gray-500 group-hover:text-white text-center">Tambah<br/>Galeri</span>
                            </div>

                            {(existingGallery || []).map((img) => (
                                <div key={img.id} className="relative w-32 h-32 border-2 border-gray-700 bg-[#121212] group">
                                  <img src={getImageUrl(img.image_url)} className="w-full h-full object-cover opacity-90 group-hover:opacity-30 transition-opacity" alt="Gallery" />
                                  <button type="button" onClick={() => removeExistingGalleryImage(img.id)} className="absolute inset-0 flex items-center justify-center bg-transparent text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={36} className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"/></button>
                                </div>
                            ))}

                            {(galleryFiles || []).map((gf, idx) => (
                                <div key={idx} className="relative w-32 h-32 border-2 border-green-800 bg-[#121212] group">
                                  <img src={gf.previewUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-30 transition-opacity" alt="New Gallery" />
                                  <div className="absolute top-1 left-1 bg-green-800 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">Baru</div>
                                  <button type="button" onClick={() => removeNewGalleryFile(idx)} className="absolute inset-0 flex items-center justify-center bg-transparent text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={36} className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"/></button>
                                </div>
                            ))}
                          </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2: INFO DASAR */}
                <div className="space-y-6 pt-8 border-t-4 border-gray-800">
                  <h3 className="text-xl font-black uppercase tracking-widest text-gray-400 border-l-4 border-white pl-3">2. Info Dasar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Nama Produk</label>
                      <input type="text" name="name" required value={productForm.name} onChange={handleProductInputChange} className="w-full px-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] text-white focus:border-white focus:outline-none transition-all font-bold uppercase text-sm placeholder-gray-700" placeholder="Contoh: T-shirt escape" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Kategori</label>
                      <div className="relative">
                        <select name="category_id" required value={productForm.category_id} onChange={handleProductInputChange} className="w-full px-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] text-white focus:border-white focus:outline-none transition-all font-bold uppercase text-sm appearance-none cursor-pointer">
                          <option value="" disabled className="text-gray-500">-- Pilih Kategori --</option>
                          {(categories || []).map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 border-l-4 border-gray-800 bg-[#1a1a1a]"><ChevronRight size={16} className="rotate-90" /></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Harga (Rp)</label>
                      <input type="number" name="price" min="0" required value={productForm.price} onChange={handleProductInputChange} className="w-full px-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] text-white focus:border-white focus:outline-none transition-all font-mono font-black text-sm placeholder-gray-700" placeholder="150000" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Berat (Gram)</label>
                      <input type="number" name="weight" min="1" required value={productForm.weight} onChange={handleProductInputChange} className="w-full px-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] text-white focus:border-white focus:outline-none transition-all font-mono font-black text-sm placeholder-gray-700" placeholder="250" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Deskripsi Detail</label>
                    <textarea name="description" rows="3" required value={productForm.description} onChange={handleProductInputChange} className="w-full px-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] text-white focus:border-white focus:outline-none transition-all font-bold text-sm custom-scrollbar placeholder-gray-700" placeholder="Tulis spesifikasi bahan..."></textarea>
                  </div>
                </div>

                {/* 3: VARIAN & STOK */}
                <div className="space-y-4 pt-8 border-t-4 border-gray-800">
                  <div className="flex items-center justify-between border-l-4 border-white pl-3 mb-6">
                    <h3 className="text-xl font-black uppercase tracking-widest text-gray-400">3. Varian & Stok</h3>
                    <button type="button" onClick={addVariant} className="flex items-center gap-1 text-xs font-black uppercase tracking-widest bg-gray-800 px-3 py-1 hover:bg-white hover:text-black transition-colors"><Plus size={14}/> Tambah Baris Varian</button>
                  </div>

                  {(variants || []).map((variant, index) => (
                    <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-4 p-4 border-2 border-gray-800 bg-[#0a0a0a] relative group">
                      <div className="w-full md:w-1/3">
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1 text-gray-500">Ukuran</label>
                        <input type="text" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} required className="w-full px-3 py-2 border-2 border-gray-700 bg-transparent text-white focus:border-white focus:outline-none font-bold text-sm uppercase" placeholder="S, M, L, XL Atau Nomor" />
                      </div>
                      <div className="w-full md:w-1/3">
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1 text-gray-500">Warna</label>
                        <input type="text" value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} required className="w-full px-3 py-2 border-2 border-gray-700 bg-transparent text-white focus:border-white focus:outline-none font-bold text-sm uppercase" placeholder="Warna" />
                      </div>
                      <div className="w-full md:w-1/3">
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1 text-gray-500">Stok</label>
                        <input type="number" min="0" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} required className="w-full px-3 py-2 border-2 border-gray-700 bg-transparent text-white focus:border-white focus:outline-none font-mono font-black text-sm" placeholder="0" />
                      </div>
                      <button type="button" onClick={() => removeVariant(index)} className="absolute -top-3 -right-3 p-1.5 bg-[#121212] border-2 border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Hapus Varian"><X size={14} className="font-black"/></button>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t-4 border-gray-800 mt-10">
                  <button type="submit" disabled={isSubmittingProduct} className="w-full bg-white text-black px-8 py-5 border-4 border-white font-black uppercase tracking-widest hover:bg-transparent hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:shadow-none hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmittingProduct ? 'MENYIMPAN DATA...' : isEditingProduct ? 'SIMPAN PERUBAHAN' : 'EKSEKUSI PRODUK BARU'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: KATEGORI */}
      {/* ========================================== */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
          <div className="bg-[#121212] border-4 border-gray-600 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] relative transform-gpu">
            <button onClick={() => setIsCatModalOpen(false)} className="absolute top-4 right-4 p-2 bg-[#0a0a0a] border-2 border-gray-600 hover:border-red-500 hover:text-red-500 transition-colors z-20">
              <X size={20} className="font-black" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter border-b-4 border-gray-800 pb-4 mb-6 text-white">
                {isEditingCat ? 'Edit Kategori' : 'Kategori Baru'}
              </h2>
              <form onSubmit={handleCatSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Nama Kategori</label>
                  <input type="text" required value={catForm.name} onChange={(e) => setCatForm({ name: e.target.value })} className="w-full px-4 py-3 border-4 border-gray-800 bg-[#0a0a0a] text-white focus:border-white focus:outline-none transition-all font-bold uppercase text-sm" placeholder="Contoh: Kemeja Pria" />
                </div>
                <button type="submit" disabled={isSubmittingCat} className="w-full bg-white text-black px-8 py-4 border-4 border-white font-black uppercase tracking-widest hover:bg-transparent hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:shadow-none hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmittingCat ? 'MENYIMPAN...' : 'SIMPAN KATEGORI'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
