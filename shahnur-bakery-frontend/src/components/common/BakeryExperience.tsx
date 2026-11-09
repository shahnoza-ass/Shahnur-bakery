import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineUser, HiOutlineMenu, HiOutlineX, HiOutlineSearch, HiOutlineLocationMarker, HiOutlineArrowRight, HiOutlineEye, HiOutlineHeart, HiOutlineSparkles } from 'react-icons/hi';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { Product } from '../../services/productService';
import { useLanguage } from '../../context/LanguageContext';

export const bakeryCategories = [
  { id: 'tort', name: 'Tortlar', photo: 'photo-1578985545062-69928b1d9587' },
  { id: 'pirojniy', name: 'Pirojniylar', photo: 'photo-1488477181946-6428a0291777' },
  { id: 'pastry', name: 'Pishiriqlar', photo: 'photo-1555507036-ab1f4038808a' },
  { id: 'cookie', name: 'Pechenyelar', photo: 'photo-1499636136210-6f4ee915583e' },
  { id: 'bread', name: 'Nonlar', photo: 'photo-1509440159596-0249088772ff' },
  { id: 'kek', name: 'Kekslar', photo: 'photo-1486427944299-d1955d23e34d' },
];
const photo = (id: string, width = 600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export function FavoriteButton({ product }: { product: Product }) {
 const { t } = useLanguage();

  const read = (): string[] => { try { const ids = JSON.parse(localStorage.getItem('shahnur_favorites') || '[]'); return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : []; } catch { return []; } };
  const [favorite, setFavorite] = useState(() => read().includes(product._id));
  const [error, setError] = useState(false);
  useEffect(() => { const sync = () => setFavorite(read().includes(product._id)); window.addEventListener('storage', sync); window.addEventListener('favorites-changed', sync); return () => { window.removeEventListener('storage', sync); window.removeEventListener('favorites-changed', sync); }; }, [product._id]);
  return <><button className="favorite-button" aria-label={`${product.name}: ${favorite ? 'sevimlilardan olib tashlash' : 'sevimlilarga qo‘shish'}`} aria-pressed={favorite} onClick={e => { e.stopPropagation(); try { const ids = read(); const next = !ids.includes(product._id); localStorage.setItem('shahnur_favorites', JSON.stringify(next ? [...ids, product._id] : ids.filter(id => id !== product._id))); setFavorite(next); setError(false); window.dispatchEvent(new Event('favorites-changed')); } catch { setError(true); } }}>{favorite ? '♥' : '♡'}</button>{error && <span role="alert">{t("Sevimlilarni saqlab bo‘lmadi")}</span>}</>;
}

export function BakeryHeader() {
  const { t, lang, setLang } = useLanguage();
  const { totalItems } = useCart();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => { setMenu(false); }, [location.pathname, location.search]);
  return <header className="bakery-header">
    <a className="skip-link" href="#main-content">{t("Asosiy mazmunga o‘tish")}</a>
    <div className="bakery-topline"><div className="bakery-container"><span><HiOutlineLocationMarker /> {t("Buxoro, O‘zbekiston")}</span><span>{t("Har kuni 09:00 — 21:00")}</span><a href="tel:+998948224702">+998 94 822 47 02</a></div></div>
    <div className="bakery-container bakery-nav">
      <Link className="bakery-brand" to="/" aria-label={t("Shahnur Bakery — bosh sahifa")}><span className="brand-seal" aria-hidden="true">{t("s")}<span>✧</span></span><span>shahnur<small>little moments, sweet memories</small></span></Link>
      <nav aria-label={t("Asosiy menyu")} className={menu ? 'bakery-links is-open' : 'bakery-links'}>
        <NavLink to="/" end>{t('Bosh sahifa')}</NavLink><NavLink to="/shop">{t('Katalog')}</NavLink><NavLink to="/cake-builder">{t('Tort konstruktori', 'Конструктор')}</NavLink><NavLink to="/contact">{t('Aloqa')}</NavLink>
        {isAuthenticated && <NavLink to="/my-orders">{t('Buyurtmalarim')}</NavLink>}
        {isAdmin && <NavLink to="/admin">{t('Admin')}</NavLink>}
        {isAuthenticated && <button onClick={logout}>{t('Chiqish')}</button>}
      </nav>
      <div className="bakery-actions"><button className="language-toggle" aria-label={t('Tilni almashtirish', 'Сменить язык')} onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}>{lang === 'uz' ? 'RU' : 'UZ'}</button><Link to="/favorites" aria-label={t('Sevimlilar', 'Избранное')}><HiOutlineHeart /></Link><Link to={isAuthenticated ? '/profile' : '/login'} aria-label={t('Shaxsiy kabinet', 'Личный кабинет')}><HiOutlineUser /></Link><Link to="/cart" aria-label={t(`Savatcha, ${totalItems} ta mahsulot`, `Корзина, товаров: ${totalItems}`)}><HiOutlineShoppingBag /><span className="bag-count">{totalItems}</span></Link><button className="mobile-toggle" aria-label={menu ? t('Menyuni yopish', 'Закрыть меню') : t('Menyuni ochish', 'Открыть меню')} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <HiOutlineX /> : <HiOutlineMenu />}</button></div>
    </div>
  <div className="bakery-container commerce-nav"><Link to="/about">{t('Biz haqimizda')}</Link><Link to="/favorites">{t('Sevimlilar', 'Избранное')}</Link><Link to="/loyalty">{t('Bonuslarim', 'Мои бонусы')}</Link><Link to="/cake-builder">{t('O‘z tortingizni yarating', 'Создайте свой торт')} ↗</Link></div></header>;
}

export function AccessibilityTools() {
 const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('shahnur_accessibility') || '{}'); return { large: s.large === true, contrast: s.contrast === true, motion: s.motion === true }; }
    catch { return { large: false, contrast: false, motion: false }; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('large-text', settings.large);
    document.documentElement.classList.toggle('high-contrast', settings.contrast);
    document.documentElement.classList.toggle('reduce-motion', settings.motion);
    try { localStorage.setItem('shahnur_accessibility', JSON.stringify(settings)); } catch { /* Settings still work without storage. */ }
  }, [settings]);
  return <aside className="accessibility-tools" aria-label={t("Qulaylik sozlamalari")}>
    {open && <div className="accessibility-panel" id="accessibility-panel"><h2>{t("O‘zingizga qulay qiling")}</h2>{([['large', 'Kattaroq matn'], ['contrast', 'Yuqori kontrast'], ['motion', 'Kamroq animatsiya']] as const).map(([key, label]) => <label key={key}><span>{t(label)}</span><input type="checkbox" checked={settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.checked })} /></label>)}<button onClick={() => setSettings({ large: false, contrast: false, motion: false })}>{t("Sozlamalarni tiklash")}</button><button onClick={() => setOpen(false)}>{t("Yopish")}</button></div>}
    <button className="accessibility-toggle" aria-label={t("Ko‘rish qulayligi sozlamalari")} aria-expanded={open} aria-controls="accessibility-panel" onClick={() => setOpen(!open)}><HiOutlineEye /></button>
  </aside>;
}

export function BakeryHome({ products, loading, Card }: { products: Product[]; loading: boolean; Card: React.ComponentType<{ product: Product }> }) {
  const { t } = useLanguage();
  const [slide, setSlide] = useState(0);
  const slides = [
    { eyebrow: 'SHAHNUR BAKERY · MEHR BILAN TAYYORLANGAN', title: 'Baxtning eng', accent: 'shirin lahzasi.', text: 'Kichik quvonchlardan unutilmas bayramlargacha. Har bir lahzangizga bir bo‘lak shirinlik qo‘shamiz.', image: 'photo-1578985545062-69928b1d9587', to: '/shop?category=tort', action: 'Tortlarni kashf eting' },
    { eyebrow: 'YANGI KUN · YANGI TA’M', title: 'Tongingizga', accent: 'iliqlik ulashing.', text: 'Xushbo‘y pishiriqlar va yoqimli suhbatlar. Shirin kun aynan shu yerdan boshlanadi.', image: 'photo-1555507036-ab1f4038808a', to: '/shop?category=pastry', action: 'Pishiriqlarni ko‘rish' },
    { eyebrow: 'SIZNING BAYRAMINGIZ · SIZNING TORTINGIZ', title: 'Orzuyingizdagi', accent: 'bayram ta’mi.', text: 'Yaqinlaringiz uchun alohida e’tibor. Maxsus tort haqida istaklaringizni biz bilan bo‘lishing.', image: 'photo-1486427944299-d1955d23e34d', to: '/contact', action: 'Maxsus tortga so‘rov' },
  ];
  const current = slides[slide];
  return <div className="bakery-home">
    <section className="bakery-hero" aria-label={t("Shahnur takliflari")}>
      <div className="hero-copy"><p className="eyebrow"><HiOutlineSparkles /> {t(current.eyebrow)}</p><h1>{t(current.title)}<br /><em>{t(current.accent)}</em></h1><p className="hero-description">{t(current.text)}</p><div className="hero-cta"><Link className="bakery-button" to={current.to}>{t(current.action)}<HiOutlineArrowRight /></Link><Link className="hero-secondary" to="/contact">{t("Maxsus buyurtma ↗")}</Link></div><div className="hero-bottom"><span><HiOutlineHeart /> {t("Har bir bo‘lakda — mehr.")}</span><div className="hero-dots" aria-label={t("Banner tanlash")}>{slides.map((s, i) => <button key={s.title} aria-label={`${i + 1}-banner: ${s.title} ${s.accent}`} aria-pressed={slide === i} onClick={() => setSlide(i)} />)}</div></div></div>
      <div className="hero-photo"><span className="hero-orbit" aria-hidden="true" /><img src={photo(current.image, 1400)} alt={slide === 0 ? 'Shokolad va rezavorlar bilan bezatilgan tort' : slide === 1 ? 'Yangi pishirilgan oltinrang kruassanlar' : 'Nafis bezatilgan bayram kekslari'} fetchPriority="high" /><span className="hero-stamp"><HiOutlineHeart /><span>{t("Bir chimdim mehr,")}<br /><i>{t("bir olam quvonch.")}</i></span></span><span className="photo-caption"><span aria-hidden="true">✧</span> {t("Shirin xotiralar shu yerdan boshlanadi")}</span></div>
    </section>
    <div className="bakery-promise"><span>{t("Mehr bilan tayyorlanadi")}</span><b aria-hidden="true">✳</b><span>{t("Har bir didga mos shirinlik")}</span><b aria-hidden="true">✳</b><span>{t("Buxorodan, muhabbat bilan")}</span><b aria-hidden="true">✳</b><span>{t("Unutilmas lahzalar uchun")}</span></div>
    <section className="bakery-container bakery-section"><div className="section-heading"><div><p className="eyebrow">{t("O‘Z TA’MINGIZNI TOPING")}</p><h2>{t("Bugun nimani xohlaysiz?")}</h2></div><Link className="text-link" to="/shop">{t("Barcha mahsulotlar")}<HiOutlineArrowRight /></Link></div><div className="bakery-categories">{bakeryCategories.map(c => <Link to={`/shop?category=${c.id}`} key={c.id}><div><img loading="lazy" src={photo(c.photo, 360)} alt="" /></div><h3>{t(c.name)}</h3><span>{t("Kashf etish ↗")}</span></Link>)}</div></section>
    <section className="bakery-container bakery-section featured-section"><div className="section-heading"><div><p className="eyebrow">{t("SHIRIN TANLOV")}</p><h2>{t("Siz uchun tayyorladik")}</h2></div><Link className="text-link" to="/shop">{t("Katalogga o‘tish")}<HiOutlineArrowRight /></Link></div>{loading ? <p role="status">{t("Mahsulotlar yuklanmoqda…")}</p> : products.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{products.slice(0, 4).map(p => <Card key={p._id} product={p} />)}</div> : <div className="bakery-empty"><h3>{t("Shirinliklar vitrinasini tayyorlayapmiz")}</h3><p>{t("Mahsulotlarni katalogdan tekshiring yoki buyurtma haqida biz bilan bog‘laning.")}</p><Link className="text-link" to="/contact">{t("Biz bilan bog‘lanish")}<HiOutlineArrowRight /></Link></div>}</section>
    <section className="bakery-container story-section"><div className="story-photo"><img loading="lazy" src={photo('photo-1509440159596-0249088772ff', 900)} alt="Usta tayyorlagan yangi nonlar" /></div><div className="story-copy"><p className="eyebrow">{t("BIZNING HIKOYAMIZ")}</p><h2>{t("Yaxshi ta’m ortida")}<br /><em>{t("katta mehr bor.")}</em></h2><p>Shahnur — dasturxon atrofida jam bo‘lish, yaqinlarga e’tibor va shirin xotiralar haqida. Biz har bir buyurtmaga shu mehrni qo‘shamiz.</p><Link className="text-link" to="/about">{t("Bizni yaqindan biling")}<HiOutlineArrowRight /></Link></div></section>
    <section className="bakery-container bakery-section"><div className="custom-order"><div><p className="eyebrow">{t("SIZ O‘YLANG, BIZ TAYYORLAYMIZ")}</p><h2>{t("Har bir bayramga")}<br />{t("alohida shirinlik.")}</h2><p>{t("Dizayn, ta’m va tafsilotlarni birgalikda tanlaymiz.")}</p></div><Link className="bakery-button" to="/contact">{t("Istaklaringizni yozing")}<HiOutlineArrowRight /></Link></div><div className="service-links"><Link to="/my-orders"><span>01</span><div><h3>{t("Buyurtmalarim")}</h3><p>{t("Buyurtma holatini kuzating")}</p></div><HiOutlineArrowRight /></Link><Link to="/chats"><span>02</span><div><h3>{t("Savolingiz bormi?")}</h3><p>{t("Yordam xizmatiga yozing")}</p></div><HiOutlineArrowRight /></Link><Link to="/contact"><span>03</span><div><h3>{t("Bizni toping")}</h3><p>{t("Manzil va aloqa ma’lumotlari")}</p></div><HiOutlineArrowRight /></Link></div></section>
  </div>;
}

export function BakeryFooter() {
 const { t } = useLanguage();

  return <footer className="shahnur-footer"><div className="bakery-container footer-grid"><div><Link className="bakery-brand" to="/"><span className="brand-seal" aria-hidden="true">{t("s")}<span>✧</span></span><span>shahnur<small>little moments, sweet memories</small></span></Link><p>{t("Kunlaringizga biroz shirinlik,")}<br />{t("xotiralaringizga ko‘proq mehr.")}</p></div><div><h2>{t("Kashf eting")}</h2><Link to="/shop">{t("Shirinliklar katalogi")}</Link><Link to="/about">{t("Bizning hikoyamiz")}</Link><Link to="/contact">{t("Maxsus buyurtma")}</Link></div><div><h2>{t("Har doim yoningizdamiz")}</h2><a href="tel:+998948224702">+998 94 822 47 02</a><p>{t("Buxoro viloyati, Buxoro tumani")}</p><p>{t("Har kuni · 09:00 — 21:00")}</p></div></div><div className="bakery-container footer-bottom"><span>© {new Date().getFullYear()} Shahnur Bakery</span><span>{t("Mehr bilan, siz uchun")}<HiOutlineHeart /></span></div></footer>;
}
