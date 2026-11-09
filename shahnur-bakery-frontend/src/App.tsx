import { BakeryHeader, BakeryHome, BakeryFooter, AccessibilityTools, FavoriteButton } from './components/common/BakeryExperience';
import { FavoritesPage, CakeBuilder, CheckoutPage, OrderExtras, LoyaltyPage, AdminCommerce, ProductIngredients, allergenNames } from './pages/CommercePages';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ChangePassword } from './components/auth/ChangePassword';
import { PasswordRecovery } from './pages/PasswordRecovery';
import { AdminMessages } from './components/admin/AdminMessages';
import { PrivateRoute } from './components/common/PrivateRoute';
import { ChatWindow } from './components/chat/ChatWindow';
import api from './services/api';
import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useSocket } from './hooks/useSocket';
import { productService, Product } from './services/productService';
import { orderService } from './services/orderService';
import { reviewService } from './services/reviewService';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminChats } from './components/admin/AdminChats';
import { AdminReviews } from './components/admin/AdminReviews';
import { AdminUsers } from './components/admin/AdminUsers';

// ==================== YANGI RANGLAR PALITRASI ====================
const COLORS = {
  primary: '#6489AA',
  primaryLight: '#8DAEC9',
  primaryDark: '#456C8E',
  gold: '#E4BDCD',
  goldLight: '#F6E5ED',
  goldDark: '#BD8EA5',
  cream: '#FAFCFE',
  creamLight: '#FFFFFF',
  creamDark: '#E5EEF6',
  creamBorder: '#D7E4EF',
  dark: '#293E58',
  darkSoft: '#536C85',
  darkMuted: '#6B8096',
  white: '#FFFFFF',
  red: '#F44336',
  green: '#4CAF50',
  yellow: '#FFC107',
  blue: '#2196F3',
  purple: '#9C27B0',
  pink: '#FF4081',
};

// ==================== HOOK: useProducts ====================
const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    let live = true;
    productService.getProducts({ limit: 100 }).then(res => { if (live) setProducts(res.data || []); })
      .catch(() => { if (live) toast.error('Mahsulotlarni yuklab bo‘lmadi'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);
  return { products, loading };
};

// ==================== HEADER ====================
const Header = BakeryHeader;

// ==================== FOOTER ====================
// ==================== PRODUCT CARD ====================
const ProductCard = ({ product }: { product: Product }) => {
 const { t, lang } = useLanguage();

  const { addToCart, isInCart } = useCart();
  const navigate = useNavigate();

  const mainImg =
    product.images?.find((i) => i.isMain)?.url ||
    product.images?.[0]?.url ||
    'https://via.placeholder.com/400';

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) {
      toast.error('Mahsulot tugagan');
      return;
    }
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: mainImg,
      quantity: 1,
    });
    toast.success(`${product.name} savatga qo'shildi!`);
  };

  return (
    <div
      className="group bg-white rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer"
      onClick={() => navigate(`/product/${product._id}`)}
      role="link" tabIndex={0} aria-label={`${product.name} — batafsil`}
      onKeyDown={e => { if (e.target === e.currentTarget && e.key === "Enter") navigate(`/product/${product._id}`); }}
      style={{
        boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)',
        border: '1px solid rgba(215, 228, 239, 0.3)',
      }}
    >
      <div className="relative overflow-hidden">
        <FavoriteButton product={product} />
        <img
          src={mainImg}
          alt={product.name}
          className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {product.averageRating > 0 && (
          <div
            className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"
            style={{
              background: 'linear-gradient(135deg, #E4BDCD 0%, #C694AC 100%)',
              color: 'white',
            }}
          >
            ⭐ {product.averageRating.toFixed(1)}
          </div>
        )}
        {product.stock === 0 && (
          <div
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #F44336 0%, #6489AA 100%)' }}
          >
            {t("Tugagan")}</div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <div
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #FF9800 0%, #FFC107 100%)' }}
          >
            {t("Kam qoldi")}</div>
        )}
      </div>

      <div className="p-5">
        <h3
          className="font-bold text-lg mb-1 line-clamp-1"
          style={{ color: '#293E58', fontFamily: 'Playfair Display, serif' }}
        >
          {lang === 'ru' ? product.nameRu || product.name : product.name}
        </h3>
        <p className="text-xs mb-3 font-semibold" style={{ color: '#6B8096' }}>
          {product.category.toUpperCase()}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span
              className="text-xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {product.price.toLocaleString()}
            </span>
            <span className="text-sm ml-1" style={{ color: '#6B8096' }}>
              so'm
            </span>
          </div>
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="px-4 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:scale-110 disabled:opacity-50"
            style={{
              background: isInCart(product._id)
                ? 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)'
                : 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
              boxShadow: '0 4px 15px rgba(100, 137, 170, 0.3)',
            }}
          >
            {isInCart(product._id) ? t('✓ Savatda', '✓ В корзине') : t('+ Savatga', '+ В корзину')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== HOME ====================
const Home = () => {
 const { t, lang } = useLanguage();

  const { products, loading } = useProducts();
  return <BakeryHome products={products} loading={loading} Card={ProductCard} />;
};

// ==================== SHOP ====================
const Shop = () => {
  const { t, lang } = useLanguage();
  const [excludeAllergens, setExcludeAllergens] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const shopLocation = useLocation();
  const [category, setCategory] = useState(() => new URLSearchParams(shopLocation.search).get('category') || 'all');
  React.useEffect(() => { setCategory(new URLSearchParams(shopLocation.search).get('category') || 'all'); setPage(1); }, [shopLocation.search]);
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  React.useEffect(() => {
    let live = true;
    setLoading(true); setError('');
    const timer = setTimeout(() => {
      productService.getProducts({ search, category, sort, page, limit: 12, excludeAllergens: excludeAllergens.join(',') || undefined })
        .then(result => { if (live) { setProducts(result.data); setPages(result.pagination.pages); } })
        .catch(() => { if (live) setError('Mahsulotlarni yuklab bo‘lmadi. Qayta urinib ko‘ring.'); })
        .finally(() => { if (live) setLoading(false); });
    }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [search, category, sort, page, excludeAllergens]);
  const filtered = products;
  const categories = ['all', 'tort', 'kek', 'pirojniy', 'cookie', 'bread', 'cake', 'pastry', 'other'];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1
        className="text-4xl md:text-5xl font-bold mb-8"
        style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
      >
        {t("Bizning")}{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, #6489AA 0%, #E4BDCD 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t("mahsulotlar")}</span>
      </h1>

      <div
        className="rounded-2xl p-6 mb-8 bg-white"
        style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            aria-label={t("Mahsulotlarni qidirish")}
            placeholder={t("Nomi bo‘yicha qidirish...")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <select
            aria-label={t("Mahsulot kategoriyasi")} value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? t('Barcha kategoriyalar', 'Все категории') : t(({ tort: 'Tortlar', cake: 'Tortlar', kek: 'Kekslar', pirojniy: 'Pirojniylar', cookie: 'Pechenyelar', bread: 'Nonlar', pastry: 'Pishiriqlar', other: 'Boshqa' } as Record<string, string>)[c] || c)}
              </option>
            ))}
          </select>
          <select
            aria-label={t("Mahsulotlarni saralash")} value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          >
            <option value="default">{t("Saralash: Standart")}</option>
            <option value="price-asc">{t("Narx: Arzon → Qimmat")}</option>
            <option value="price-desc">{t("Narx: Qimmat → Arzon")}</option>
          </select>
        </div>
      </div>

      <fieldset className="commerce-panel allergen-filters"><legend>{t('Tarkibdan chiqarish', 'Исключить из состава')}</legend>{Object.entries(allergenNames).map(([id, names]) => <label className="check-row" key={id}><input type="checkbox" checked={excludeAllergens.includes(id)} onChange={e => { setExcludeAllergens(current => e.target.checked ? [...current, id] : current.filter(a => a !== id)); setPage(1); }} />{t(...names)}</label>)}<small>{t('Filtr faqat tarkibi tasdiqlangan mahsulotlarni ko‘rsatadi. Kesishma allergenlarni do‘kondan aniqlashtiring.', 'Фильтр показывает товары с проверенным составом. Уточните риск перекрёстного контакта в магазине.')}</small></fieldset>
      {loading ? <p role="status" className="text-center py-16">{t("Yuklanmoqda...")}</p> : error ? <p role="alert" className="text-red-700 text-center py-16">{error}</p> : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <p style={{ color: '#6B8096' }}>{t("Mahsulot topilmadi")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
      <div className="flex justify-center items-center gap-5 mt-8"><button disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)} className="border rounded-xl px-4 py-2 disabled:opacity-40">{t("Oldingi")}</button><span>{page} / {Math.max(1, pages)}</span><button disabled={loading || page >= pages} onClick={() => setPage(p => p + 1)} className="border rounded-xl px-4 py-2 disabled:opacity-40">{t("Keyingi")}</button></div>
    </div>
  );
};

// ==================== PRODUCT DETAIL ====================
const ProductDetail = () => {
 const { t, lang } = useLanguage();

  const { id } = useParams();
  const { addToCart, isInCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const { products: relatedProducts } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true); setQuantity(1); setActiveImage(0);
      if (id.length < 24) {
        const fallback = null;
        setProduct(fallback || null);
        setLoading(false);
        return;
      }
      try {
        const data = await productService.getProduct(id);
        setProduct(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallback = null;
          setProduct(fallback || null);
        } else {
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  React.useEffect(() => {
    (async () => {
      if (!id) return;
      if (id.length < 24) { setReviews([]); return; }
      try {
        const res = await reviewService.getProductReviews(id);
        setReviews(res.data || []);
      } catch {
        setReviews([]);
      }
    })();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock <= 0) {
      toast.error('Mahsulot tugagan');
      return;
    }
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url || '',
      quantity,
    });
    toast.success(`${product.name} savatga qo'shildi!`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Sharh qoldirish uchun tizimga kiring');
      return;
    }
    setSubmitting(true);
    try {
      const newReview = await reviewService.createReview({
        productId: id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      });
      setReviews([newReview, ...reviews]);
      toast.success('Sharhingiz qabul qilindi!');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
    } catch {
      toast.error('Sharh saqlanmadi. Faqat yetkazilgan buyurtma mahsulotiga sharh yozish mumkin.');
      setSubmitting(false);
      return;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <p style={{ color: '#6B8096' }}>{t("Yuklanmoqda...")}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-4">{t("Mahsulot topilmadi")}</h1>
        <Link
          to="/shop"
          className="inline-block px-6 py-3 rounded-full font-semibold text-white"
          style={{ backgroundColor: '#6489AA', textDecoration: 'none' }}
        >
          {t("Do'konga qaytish")}</Link>
      </div>
    );
  }

  const images =
    product.images?.length > 0
      ? product.images
      : [{ url: 'https://via.placeholder.com/600', isMain: true }];
  const mainImage = images[activeImage]?.url || images[0]?.url;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : product.averageRating || 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 text-sm" style={{ color: '#6B8096' }}>
        <Link to="/" style={{ color: '#6B8096', textDecoration: 'none' }}>
          {t("Asosiy")}</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" style={{ color: '#6B8096', textDecoration: 'none' }}>
          {t("Mahsulotlar")}</Link>
        <span className="mx-2">/</span>
        <span style={{ color: '#6489AA' }}>{lang === 'ru' ? product.nameRu || product.name : product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div>
          <div
            className="rounded-3xl overflow-hidden mb-4"
            style={{
              backgroundColor: '#FAFCFE',
              boxShadow: '0 20px 60px rgba(100, 137, 170, 0.15)',
              border: '4px solid white',
            }}
          >
            <img src={mainImage} alt={product.name} className="w-full h-[500px] object-cover" />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    border:
                      activeImage === i ? '3px solid #6489AA' : '3px solid transparent',
                  }}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} ${i + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span
            className="inline-block px-4 py-2 rounded-full text-xs font-bold mb-3"
            style={{
              background: 'linear-gradient(135deg, rgba(100, 137, 170, 0.15) 0%, rgba(228, 189, 205, 0.15) 100%)',
              color: '#6489AA',
            }}
          >
            {product.category.toUpperCase()}
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
          >
            {lang === 'ru' ? product.nameRu || product.name : product.name}
          </h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    color: star <= Math.round(avgRating) ? '#FFC107' : '#D1D5DB',
                    fontSize: '20px',
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="font-bold">{avgRating.toFixed(1)}</span>
            <span style={{ color: '#6B8096' }}>({reviews.length} {t("sharh)")}</span>
          </div>

          <div className="mb-6">
            <span
              className="text-4xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #6489AA 0%, #E4BDCD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {product.price.toLocaleString()} so'm
            </span>
            {product.stock > 0 ? (
              <span
                className="ml-3 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
              >
                {t("✅ Mavjud (")}{product.stock} {t("dona)")}</span>
            ) : (
              <span
                className="ml-3 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
              >
                {t("❌ Tugagan")}</span>
            )}
          </div>

          <p className="text-lg mb-6" style={{ color: '#536C85', lineHeight: '1.8' }}>
            {(lang === 'ru' ? product.descriptionRu || product.description : product.description) || t('Tavsif yo‘q', 'Нет описания')}
          </p>
          <ProductIngredients product={product} />

          <div className="flex items-center gap-4 mb-6">
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-full"
              style={{ backgroundColor: '#FAFCFE' }}
            >
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-2xl font-bold"
                style={{ color: '#6489AA' }}
              >
                −
              </button>
              <span className="w-12 text-center font-bold text-xl">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="text-2xl font-bold"
                style={{ color: '#6489AA' }}
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 py-4 rounded-full font-bold text-white disabled:opacity-50 transition-all hover:scale-105"
              style={{
                background: isInCart(product._id)
                  ? 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)'
                  : 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
                boxShadow: '0 8px 30px rgba(100, 137, 170, 0.4)',
              }}
            >
              {isInCart(product._id) ? t('✓ Savatda', '✓ В корзине') : t('Savatga qo‘shish', 'В корзину')}
            </button>
          </div>

          <div
            className="grid grid-cols-2 gap-4 p-5 rounded-2xl"
            style={{ backgroundColor: '#FAFCFE' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚚</span>
              <div>
                <p className="text-xs" style={{ color: '#6B8096' }}>
                  {t("Yetkazib berish")}</p>
                <p className="font-semibold text-sm">{t("30 daqiqada")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="text-xs" style={{ color: '#6B8096' }}>
                  {t("Sifat kafolati")}</p>
                <p className="font-semibold text-sm">{t("100% tabiiy")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div className="border-t pt-12" style={{ borderColor: '#E5EEF6' }}>
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h2
            className="text-3xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
          >
            {t("Sharhlar (")}{reviews.length})
          </h2>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-6 py-3 rounded-full font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
              boxShadow: '0 4px 15px rgba(100, 137, 170, 0.3)',
            }}
          >
            {showReviewForm ? 'Bekor qilish' : '✍️ Sharh qoldirish'}
          </button>
        </div>

        {showReviewForm && (
          <form
            onSubmit={handleSubmitReview}
            className="bg-white rounded-3xl p-6 mb-8 space-y-4"
            style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
          >
            <div>
              <label className="block font-bold mb-2">{t("Baho:")}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    style={{
                      fontSize: '36px',
                      color: star <= reviewForm.rating ? '#FFC107' : '#D1D5DB',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <input
              required
              placeholder={t("Sharh sarlavhasi")}
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              className="w-full px-5 py-3 rounded-full border-2 outline-none"
              style={{ borderColor: '#E5EEF6' }}
            />
            <textarea
              required
              placeholder={t("Sharhingizni yozing...")}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              rows={4}
              className="w-full px-5 py-3 rounded-3xl border-2 outline-none"
              style={{ borderColor: '#E5EEF6' }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-full font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)' }}
            >
              {submitting ? 'Yuborilmoqda...' : 'Sharhni yuborish'}
            </button>
          </form>
        )}

        {reviews.length > 0 && (
          <div
            className="bg-white rounded-3xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-8"
            style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
          >
            <div className="text-center">
              <div
                className="text-6xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #6489AA 0%, #E4BDCD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {avgRating.toFixed(1)}
              </div>
              <div className="flex justify-center my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    style={{
                      color: star <= Math.round(avgRating) ? '#FFC107' : '#D1D5DB',
                      fontSize: '24px',
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p style={{ color: '#6B8096' }}>{reviews.length} {t("ta sharh")}</p>
            </div>
            <div className="space-y-2">
              {ratingCounts.map((rc) => (
                <div key={rc.star} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-bold">{rc.star} ★</span>
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: '#E5EEF6' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #6489AA 0%, #E4BDCD 100%)',
                        width: `${reviews.length > 0 ? (rc.count / reviews.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-sm" style={{ color: '#6B8096' }}>
                    {rc.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div
            className="text-center py-12 bg-white rounded-3xl"
            style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
          >
            <div className="text-5xl mb-4">💬</div>
            <p className="text-lg" style={{ color: '#6B8096' }}>
              {t("Hozircha sharhlar yo'q")}</p>
            <p className="text-sm" style={{ color: '#6B8096' }}>
              {t("Birinchi bo'lib sharh qoldiring!")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-white rounded-3xl p-6"
                style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-lg"
                    style={{ background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)' }}
                  >
                    {review.user?.firstName?.[0]}
                    {review.user?.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-lg">
                        {review.user?.firstName} {review.user?.lastName}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
                        >
                          {t("✓ Xarid qilgan")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            style={{
                              color: star <= review.rating ? '#FFC107' : '#D1D5DB',
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: '#6B8096' }}>
                        {new Date(review.createdAt).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                    <h4 className="font-bold mb-1">{review.title}</h4>
                    <p style={{ color: '#536C85' }}>{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-12 mt-12" style={{ borderColor: '#E5EEF6' }}>
        <h2
          className="text-3xl font-bold mb-8"
          style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
        >
          {t("O'xshash mahsulotlar")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.filter(
            (p) => p._id !== product._id && p.category === product.category
          )
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
        </div>
      </div>
    </div>
  );
};

// ==================== CART ====================
const Cart = () => {
 const { t, lang } = useLanguage();

  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1
          className="text-4xl font-bold mb-8"
          style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
        >
          {t("Savat")}</h1>
        <div
          className="bg-white rounded-3xl p-12 text-center"
          style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
        >
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-xl mb-6" style={{ color: '#6B8096' }}>
            {t("Savat bo'sh")}</p>
          <Link
            to="/shop"
            className="inline-block px-8 py-4 rounded-full font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
              boxShadow: '0 8px 30px rgba(100, 137, 170, 0.4)',
              textDecoration: 'none',
            }}
          >
            {t("Xarid qilish")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1
        className="text-4xl font-bold mb-8"
        style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
      >
        {t("Savat")}</h1>

      <div
        className="bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
      >
        {cart.map((item) => (
          <div key={item.cartKey || item.productId} className="flex flex-wrap items-center gap-4 p-4 border-b last:border-b-0">
            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-2xl" />
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: '#293E58' }}>
                {item.name}
              </h3>
              <p className="text-sm font-semibold" style={{ color: '#6489AA' }}>
                {item.price.toLocaleString()} so'm
              </p>
              {item.customization && <small>{item.customization.weight} kg · {item.customization.flavor} / {item.customization.cream} / {item.customization.decoration}<br />{item.customization.inscription}</small>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.cartKey || item.productId, item.quantity - 1)}
                className="w-9 h-9 rounded-full font-bold"
                style={{ backgroundColor: '#FAFCFE', color: '#6489AA' }}
              >
                −
              </button>
              <span className="w-8 text-center font-bold">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.cartKey || item.productId, item.quantity + 1)}
                className="w-9 h-9 rounded-full font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)' }}
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="font-bold" style={{ color: '#6489AA' }}>
                {(item.price * item.quantity).toLocaleString()} so'm
              </p>
              <button
                onClick={() => removeFromCart(item.cartKey || item.productId)}
                className="text-sm text-red-500 hover:underline"
              >
                {t("O'chirish")}</button>
            </div>
          </div>
        ))}
      </div>

      <div
        className="bg-white rounded-3xl p-6 mt-6"
        style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
      >
        <div className="flex justify-between mb-4">
          <span className="text-lg font-bold">{t("Jami:")}</span>
          <span
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #6489AA 0%, #E4BDCD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {totalPrice.toLocaleString()} so'm
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={clearCart}
            className="px-6 py-3 rounded-full font-bold"
            style={{ backgroundColor: '#FAFCFE', color: '#6489AA' }}
          >
            {t("Tozalash")}</button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.error('Buyurtma berish uchun tizimga kiring');
                navigate('/login');
                return;
              }
              navigate('/checkout');
            }}
            className="flex-1 py-3 rounded-full font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
              boxShadow: '0 8px 30px rgba(100, 137, 170, 0.4)',
            }}
          >
            {t("Buyurtma berish")}</button>
        </div>
      </div>
    </div>
  );
};

// ==================== CHECKOUT ====================
// ==================== MY ORDERS ====================
const MyOrders = () => {
 const { t, lang } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [revision, setRevision] = useState(0);
  const [cancelling, setCancelling] = useState('');
  const { socket } = useSocket();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        const res = await orderService.getMyOrders(page);
        setPages(res.pagination.pages);
        setOrders(res.data || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, navigate, page, revision]);
  React.useEffect(() => {
    if (!socket) return;
    const refresh = () => setRevision(value => value + 1);
    socket.on('order_status_updated', refresh);
    return () => { socket.off('order_status_updated', refresh); };
  }, [socket]);
  const cancel = async (id: string) => {
    if (cancelling || !window.confirm('Buyurtma bekor qilinsinmi?')) return;
    setCancelling(id);
    try { await orderService.cancelOrder(id); setRevision(value => value + 1); toast.success('Buyurtma bekor qilindi'); }
    catch { toast.error('Buyurtmani bekor qilib bo‘lmadi'); }
    finally { setCancelling(''); }
  };

  const statusLabels: any = {
    pending: '⏳ Kutilmoqda',
    confirmed: '✅ Tasdiqlangan',
    preparing: '👨‍🍳 Tayyorlanmoqda',
    ready: '📦 Tayyor',
    out_for_delivery: '🚚 Yetkazilmoqda',
    delivered: '✅ Yetkazilgan',
    cancelled: '❌ Bekor qilingan',
  };

  if (loading) return <div className="text-center py-20">{t("Yuklanmoqda...")}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1
        className="text-4xl font-bold mb-8"
        style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
      >
        {t("Mening buyurtmalarim")}</h1>

      {orders.length === 0 ? (
        <div
          className="bg-white rounded-3xl p-12 text-center"
          style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
        >
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl mb-6" style={{ color: '#6B8096' }}>
            {t("Buyurtmalar yo'q")}</p>
          <Link
            to="/shop"
            className="inline-block px-8 py-4 rounded-full font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
              boxShadow: '0 8px 30px rgba(100, 137, 170, 0.4)',
              textDecoration: 'none',
            }}
          >
            {t("Xarid qilish")}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl p-6"
              style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#293E58' }}>
                    #{order.orderNumber}
                  </h3>
                  <p className="text-sm" style={{ color: '#6B8096' }}>
                    {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
                <span
                  className="px-4 py-1.5 rounded-full text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(100, 137, 170, 0.15) 0%, rgba(228, 189, 205, 0.15) 100%)',
                    color: '#6489AA',
                  }}
                >
                  {t(statusLabels[order.status] || order.status, ({ pending: '⏳ Ожидается', confirmed: '✅ Подтверждён', preparing: '👨‍🍳 Готовится', ready: '📦 Готов', out_for_delivery: '🚚 Доставляется', delivered: '✅ Доставлен', cancelled: '❌ Отменён', refunded: 'Возврат' } as Record<string, string>)[order.status])}
                </span>
              </div>
              {!['delivered', 'cancelled', 'refunded'].includes(order.status) && <button disabled={!!cancelling} onClick={() => cancel(order._id)} className="text-red-700 border border-red-200 rounded-lg px-3 py-2 mb-4 disabled:opacity-50">{cancelling === order._id ? 'Bekor qilinmoqda...' : 'Buyurtmani bekor qilish'}</button>}
              <div className="space-y-2 mb-4">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{(item.price * item.quantity).toLocaleString()} so'm</span>
                  </div>
                ))}
              </div>
              <div
                className="flex justify-between pt-4"
                style={{ borderTop: '1px solid #E5EEF6' }}
              >
                <span className="font-bold">{t("Jami:")}</span>
                <span
                  className="font-bold text-lg"
                  style={{
                    background: 'linear-gradient(135deg, #6489AA 0%, #E4BDCD 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {order.finalAmount?.toLocaleString()} so'm
                </span>
              </div>
              <OrderExtras order={order} />
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center gap-5 mt-8"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t("Oldingi")}</button><span>{page} / {Math.max(1, pages)}</span><button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>{t("Keyingi")}</button></div>
    </div>
  );
};

// ==================== LOGIN ====================
const Login = () => {
 const { t, lang } = useLanguage();

  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser: any = await login(form.email, form.password);
      if (loggedUser?.role === 'admin' || loggedUser?.role === 'superadmin') {
        toast.success('Admin panelga xush kelibsiz! 👨‍💼');
        navigate('/admin');
      } else {
        toast.success('Xush kelibsiz!');
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div
        className="bg-white rounded-3xl p-8"
        style={{ boxShadow: '0 20px 60px rgba(100, 137, 170, 0.15)' }}
      >
        <h1
          className="text-3xl font-bold mb-6 text-center"
          style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
        >
          {t("Kirish")}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder={t("Email")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <input
            type="password"
            required
            placeholder={t("Parol")}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-bold text-white disabled:opacity-50 transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
              boxShadow: '0 8px 30px rgba(100, 137, 170, 0.4)',
            }}
          >
            {loading ? t('Kirish...', 'Вход...') : t('Kirish')}
          </button>
        <Link to="/forgot-password" className="block text-center text-pink-700 mt-4">{t("Parolni unutdingizmi?")}</Link>
        </form>
        <p className="text-center mt-4 text-sm" style={{ color: '#6B8096' }}>
          {t("Hisobingiz yo'qmi?")}{' '}
          <Link to="/register" style={{ color: '#6489AA', textDecoration: 'none', fontWeight: 'bold' }}>
            {t("Ro'yxatdan o'tish")}</Link>
        </p>
      </div>
    </div>
  );
};

// ==================== REGISTER ====================
const Register = () => {
 const { t, lang } = useLanguage();

  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+998',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Parol kamida 8 belgidan iborat bo'lishi kerak");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Parollar mos emas');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/login');
    } catch {
      // Xatolik api.ts da
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div
        className="bg-white rounded-3xl p-8"
        style={{ boxShadow: '0 20px 60px rgba(100, 137, 170, 0.15)' }}
      >
        <h1
          className="text-3xl font-bold mb-6 text-center"
          style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
        >
          {t("Ro'yxatdan o'tish")}</h1>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <input
            required
            placeholder={t("Ism")}
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <input
            required
            placeholder={t("Familiya")}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <input
            type="email"
            required
            placeholder={t("Email")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <input
            type="tel"
            required
            placeholder={t("+998901234567")}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <input
            type="password"
            required
            placeholder={t("Parol (kamida 8 belgi)")}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
            minLength={8}
          />
          <input
            type="password"
            required
            placeholder={t("Parolni tasdiqlang")}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
            minLength={8}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-bold text-white disabled:opacity-50 transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
              boxShadow: '0 8px 30px rgba(100, 137, 170, 0.4)',
            }}
          >
            {loading ? t('Yuborilmoqda...', 'Отправка...') : t("Ro'yxatdan o'tish")}
          </button>
        </form>
        <p className="text-center mt-4 text-sm" style={{ color: '#6B8096' }}>
          {t("Hisobingiz bormi?")}{' '}
          <Link to="/login" style={{ color: '#6489AA', textDecoration: 'none', fontWeight: 'bold' }}>
            {t("Kirish")}</Link>
        </p>
      </div>
    </div>
  );
};

// ==================== PROFILE ====================
const Profile = () => {
 const { t, lang } = useLanguage();

  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
    } catch {
      // Xatolik api.ts da
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1
        className="text-4xl font-bold mb-8"
        style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
      >
        {t("Profil")}</h1>
      <div
        className="bg-white rounded-3xl p-8"
        style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
              boxShadow: '0 8px 25px rgba(100, 137, 170, 0.3)',
            }}
          >
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p style={{ color: '#6B8096' }}>{user?.email}</p>
            <span
              className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, rgba(100, 137, 170, 0.15) 0%, rgba(228, 189, 205, 0.15) 100%)',
                color: '#6489AA',
              }}
            >
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder={t("Ism")}
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <input
            placeholder={t("Familiya")}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <input
            placeholder={t("Telefon")}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-bold text-white transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
              boxShadow: '0 8px 30px rgba(100, 137, 170, 0.4)',
            }}
          >
            {loading ? t('Saqlanmoqda...', 'Сохранение...') : t('Saqlash', 'Сохранить')}
          </button>
        </form>
        <ChangePassword />
      </div>
    </div>
  );
};

// ==================== CHAT ====================
const Chats = () => { const { t } = useLanguage(); return <div className="max-w-5xl mx-auto px-4 py-12"><h1 className="text-3xl font-bold mb-6">{t("Yordam xizmati")}</h1><ChatWindow /></div>; };

// ==================== ABOUT ====================
const About = () => { const { t } = useLanguage(); return (
  <div className="about-page max-w-4xl mx-auto px-4 py-12">
    <h1
      className="text-4xl md:text-5xl font-bold mb-8"
      style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
    >
      {t("Biz")}{' '}
      <span
        style={{
          background: 'linear-gradient(135deg, #6489AA 0%, #E4BDCD 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {t("haqimizda")}</span>
    </h1>
    <div
      className="bg-white rounded-3xl p-8 space-y-4"
      style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)', color: '#536C85' }}
    >
      <p className="text-lg">
        <strong style={{ color: '#6489AA' }}>Shahnur Bakery</strong> {t("— nafis qandolatchilik mahsulotlari ishlab chiqaruvchi oilaviy korxona.")}</p>
      <p>
        {t("Biz 2015-yildan buyon Buxoro tumanida faoliyat yuritamiz. Har bir tort va pirojniy maxsus retsept bo'yicha tayyorlanadi.")}</p>
      <p>
        {t("Bizning maqsadimiz — mijozlarimizga nafaqat mazali, balki ko'rinishi bilan ham hayratlanarli qandolatchilik mahsulotlarini taqdim etish. 🎂")}</p>
    </div>
  </div>
); };

// ==================== CONTACT ====================
const Contact = () => {
 const { t, lang } = useLanguage();

  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const [sending, setSending] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (sending) return; setSending(true);
    try {
      await api.post('/contact', form);
      toast.success('Xabaringiz qabul qilindi!');
      setForm({ name: '', email: '', message: '' });
    } catch { toast.error('Xabar saqlanmadi. Qayta urinib ko?ring.'); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1
        className="text-4xl md:text-5xl font-bold mb-8"
        style={{ fontFamily: 'Playfair Display, serif', color: '#293E58' }}
      >
        {t("Biz bilan")}{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, #6489AA 0%, #E4BDCD 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t("bog'laning")}</span>
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          className="bg-white rounded-3xl p-8 space-y-4"
          style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)', color: '#536C85' }}
        >
          <p className="text-lg">{t("📍 Buxoro viloyati, Buxoro tumani")}</p>
          <p className="text-lg">📞 +998 94 822 47 02</p>
          <p className="text-lg">{t("✉️ info@shahnurbakery.uz")}</p>
          <p className="text-lg">🕐 09:00 - 21:00</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-8 space-y-4"
          style={{ boxShadow: '0 10px 40px rgba(100, 137, 170, 0.08)' }}
        >
          <input
            required
            placeholder={t("Ismingiz")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <input
            type="email"
            required
            placeholder={t("Email")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-5 py-3 rounded-full border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <textarea
            required
            placeholder={t("Xabar")}
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-5 py-3 rounded-3xl border-2 outline-none"
            style={{ borderColor: '#E5EEF6' }}
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full py-4 rounded-full font-bold text-white transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
              boxShadow: '0 8px 30px rgba(100, 137, 170, 0.4)',
            }}
          >
            {sending ? 'Yuborilmoqda...' : 'Yuborish'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==================== 404 ====================
const NotFound = () => { const { t } = useLanguage(); return (
  <div className="max-w-4xl mx-auto px-4 py-24 text-center">
    <h1
      className="text-9xl font-bold mb-4"
      style={{
        background: 'linear-gradient(135deg, #6489AA 0%, #E4BDCD 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      404
    </h1>
    <h2 className="text-3xl font-bold mb-4">{t("Sahifa topilmadi")}</h2>
    <Link
      to="/"
      className="inline-block px-8 py-4 rounded-full font-bold text-white"
      style={{
        background: 'linear-gradient(135deg, #6489AA 0%, #8DAEC9 100%)',
        boxShadow: '0 8px 30px rgba(100, 137, 170, 0.4)',
        textDecoration: 'none',
      }}
    >
      {t("Asosiy sahifaga qaytish")}</Link>
  </div>
); };

// ==================== MAIN APP ====================
function App() {
 const { t } = useLanguage();

  return (
    <LanguageProvider><Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <div
              className="min-h-screen flex flex-col"
              style={{ backgroundColor: '#FAFCFE', fontFamily: 'Inter, Arial, sans-serif' }}
            >
              <Header />
              <main id="main-content" tabIndex={-1} className="flex-grow bakery-main">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/cake-builder" element={<CakeBuilder />} />
                  <Route path="/loyalty" element={<PrivateRoute><LoyaltyPage /></PrivateRoute>} />
                  <Route path="/admin/commerce" element={<PrivateRoute adminOnly><AdminCommerce /></PrivateRoute>} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/forgot-password" element={<PasswordRecovery />} />
                  <Route path="/reset-password/:token" element={<PasswordRecovery />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
                  <Route path="/my-orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/chats" element={<PrivateRoute><Chats /></PrivateRoute>} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
                  <Route path="/admin/products" element={<PrivateRoute adminOnly><AdminProducts /></PrivateRoute>} />
                  <Route path="/admin/orders" element={<PrivateRoute adminOnly><AdminOrders /></PrivateRoute>} />
                  <Route path="/admin/chats" element={<PrivateRoute adminOnly><AdminChats /></PrivateRoute>} />
                  <Route path="/admin/reviews" element={<PrivateRoute adminOnly><AdminReviews /></PrivateRoute>} />
                  <Route path="/admin/messages" element={<PrivateRoute adminOnly><AdminMessages /></PrivateRoute>} />
                  <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <BakeryFooter />
              <AccessibilityTools />
            </div>
            <Toaster position="top-right" />
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </Router></LanguageProvider>
  );
}

export default App;
