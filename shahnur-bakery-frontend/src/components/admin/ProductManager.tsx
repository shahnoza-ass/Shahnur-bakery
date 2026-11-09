import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { productService, Product } from '../../services/productService';
import { AdminLayout } from './AdminLayout';
import { allergenNames } from '../../pages/CommercePages';
import '../../styles/product-manager.css';
import { ProductPhotos, ProductPicture } from './ProductPhotos';
import { validateProductForm } from '../../utils/productForm';

type Picture = ProductPicture;
const categories: Record<string, string> = { tort: 'Tort', kek: 'Kek / kapkeyk', pirojniy: 'Pirojniy', cookie: 'Pechenye', bread: 'Non', cake: 'Keks', pastry: 'Pishiriq', other: 'Boshqa mahsulot' };
const empty = { name: '', description: '', price: '', discountPrice: '', stock: '', category: 'tort', weight: '', weightUnit: 'kg' as 'kg' | 'g' | 'lb' | 'oz', isAvailable: true, ingredients: '', allergens: [] as string[], ingredientsVerified: false, customizable: false, customPricePerKg: '150000', lowStockThreshold: '5', nameRu: '', descriptionRu: '' };
const mainPhoto = (p: Product) => p.images?.find(i => i.isMain)?.url || p.images?.[0]?.url;

// Resize phone photos before uploading; browser decoding respects image orientation.
async function preparePhoto(file: File): Promise<File> {
  if (file.size > 30 * 1024 * 1024) throw new Error('Rasm juda katta. 30 MB dan kichik rasm tanlang.');
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Rasmni o‘qib bo‘lmadi. JPG, PNG yoki WEBP formatidan foydalaning.')); img.src = url; });
    const ratio = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d'); if (!context) throw new Error('Brauzer rasm tayyorlashni qo‘llamayapti.');
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Rasm tayyorlanmadi.')), 'image/jpeg', .85));
    if (blob.size > 5 * 1024 * 1024) throw new Error('Rasm 5 MB dan katta. Kichikroq rasm tanlang.');
    return new File([blob], 'product-photo.jpg', { type: 'image/jpeg' });
  } finally { URL.revokeObjectURL(url); }
}

export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  const [stockBusy, setStockBusy] = useState('');
  const lock = useRef(false);
  const objects = useRef<string[]>([]);
  const dialog = useRef<HTMLDivElement>(null);
  const message = (e: any) => e.response?.data?.message || e.message || 'Amal bajarilmadi. Qayta urinib ko‘ring.';
  const clearUrls = () => { objects.current.forEach(u => URL.revokeObjectURL(u)); objects.current = []; };
  useEffect(() => () => clearUrls(), []);
  const load = async () => { setLoading(true); setLoadError(''); try { const r = await api.get('/admin/products', { params: { limit: 100 } }); setProducts(r.data.data || []); } catch (e) { setLoadError(message(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const close = () => { if (!lock.current) { setModal(false); clearUrls(); } };
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    dialog.current?.querySelector<HTMLButtonElement>('header button')?.focus({ preventScroll: true });
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lock.current) { setModal(false); clearUrls(); }
      if (e.key === 'Tab') {
        const nodes = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([type=file]),select:not(:disabled),textarea:not(:disabled),summary');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [modal]);
  const open = (p?: Product) => {
    clearUrls(); setPreview(false); setEditing(p || null); setError(''); setProgress(''); setUrl('');
    setForm(p ? { ...empty, ...p, price: String(p.price), discountPrice: p.discountPrice ? String(p.discountPrice) : '', stock: String(p.stock), weight: p.weight ? String(p.weight) : '', weightUnit: p.weightUnit || 'kg', ingredients: Array.isArray(p.ingredients) ? p.ingredients.join(', ') : p.ingredients || '', allergens: p.allergens || [], customPricePerKg: String(p.customPricePerKg || 150000), lowStockThreshold: String(p.lowStockThreshold ?? 5), nameRu: p.nameRu || '', descriptionRu: p.descriptionRu || '', customizable: !!p.customizable, ingredientsVerified: !!p.ingredientsVerified } : { ...empty });
    const ordered = p ? [...(p.images || [])].sort((a, b) => Number(b.isMain) - Number(a.isMain)) : [];
    setPictures(ordered.map(i => ({ url: i.url, publicId: (i as any).publicId }))); setModal(true);
  };
  const select = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []); event.target.value = '';
    if (!files.length || lock.current) return;
    if (pictures.length + files.length > 5) { setError('Bir mahsulotga 5 tagacha rasm qo‘shish mumkin.'); return; }
    setPreparing(true); lock.current = true; setError(''); setProgress('Rasmlar tayyorlanmoqda…');
    const additions: Picture[] = [];
    try { for (const [i, file] of files.entries()) { setProgress(`${i + 1} / ${files.length} ta rasm tayyorlanmoqda…`); const prepared = await preparePhoto(file); const u = URL.createObjectURL(prepared); objects.current.push(u); additions.push({ url: u, file: prepared }); } setPictures(p => [...p, ...additions]); }
    catch (e) { additions.forEach(p => URL.revokeObjectURL(p.url)); setError(message(e)); }
    finally { lock.current = false; setPreparing(false); setProgress(''); }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (lock.current) return;
    const validation = validateProductForm(form);
    if (validation) { setError(validation); return; }
    if (!pictures.length) { setError('Mahsulot uchun kamida bitta rasm tanlang.'); return; }
    if (form.discountPrice && (Number(form.discountPrice) <= 0 || Number(form.discountPrice) >= Number(form.price))) { setError('Chegirmali narx asosiy narxdan kichik va 0 dan katta bo‘lsin.'); return; }
    lock.current = true; setSaving(true); setError('');
    try {
      let uploaded = [...pictures];
      const pending = pictures.filter(p => p.file);
      if (pending.length) {
        setProgress('Rasmlar yuklanmoqda…');
        const data = new FormData(); pending.forEach(p => data.append('images', p.file!));
        const response = await api.post('/products/upload-images', data, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000, onUploadProgress: e => { if (e.total) setProgress(`Rasmlar yuklanmoqda: ${Math.round(e.loaded / e.total * 100)}%`); } });
        let index = 0; uploaded = pictures.map(p => p.file ? response.data.data[index++] : p);
        if (uploaded.some(p => !p?.url)) throw new Error('Rasm yuklash tugallanmadi. Qayta urinib ko‘ring.');
        setPictures(uploaded);
      }
      setProgress('Mahsulot saqlanmoqda…');
      const payload = { ...form, name: form.name.trim(), description: form.description.trim(), price: Number(form.price), discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined, stock: Number(form.stock), weight: Number(form.weight) || 0, lowStockThreshold: Number(form.lowStockThreshold), customPricePerKg: Number(form.customPricePerKg), images: uploaded.map((p, i) => ({ url: p.url, publicId: p.publicId || '', isMain: i === 0 })) };
      if (editing && !form.discountPrice) (payload as any).discountPrice = null;
      if (editing) await productService.updateProduct(editing._id, payload as any); else await productService.createProduct(payload as any);
      toast.success(editing ? 'Mahsulot yangilandi' : 'Yangi mahsulot qo‘shildi'); setModal(false); clearUrls(); await load();
    } catch (e) { setError(message(e)); } finally { setSaving(false); lock.current = false; setProgress(''); }
  };
  const toggle = async (p: Product) => { if (stockBusy) return; setStockBusy(p._id); try { await productService.updateProduct(p._id, { isAvailable: !p.isAvailable }); await load(); toast.success(p.isAvailable ? 'Mahsulot yashirildi' : 'Mahsulot sotuvga qaytarildi'); } catch (e) { toast.error(message(e)); } finally { setStockBusy(''); } };
  const visible = products.filter(p => p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (filter === 'all' || p.category === filter));
  return <AdminLayout title="Mahsulotlar" subtitle="Telefondan rasm, narx va mahsulotlarni boshqaring"><div className="product-manager">
    <div className="pm-toolbar"><div><h2>Shirinliklar kolleksiyasi</h2><p>{products.length} ta mahsulot · {products.filter(p => p.isAvailable && p.stock > 0).length} ta sotuvda</p></div><button className="pm-primary" onClick={() => open()}>＋ Mahsulot qo‘shish</button></div>
    <div className="pm-filters"><input type="search" aria-label="Mahsulot qidirish" placeholder="Nomi bo‘yicha qidirish…" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Kategoriya" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Barcha kategoriyalar</option>{Object.entries(categories).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></div>
    {loading ? <p role="status" className="pm-empty">Mahsulotlar yuklanmoqda…</p> : loadError ? <div className="pm-empty" role="alert">{loadError}<button onClick={load}>Qayta urinish</button></div> : <><div className="pm-grid">{visible.map(p => <article className="pm-card" key={p._id}><div className="pm-card-photo">{mainPhoto(p) ? <img src={mainPhoto(p)} alt={p.name} loading="lazy" /> : <span>Rasm qo‘shing</span>}<span className={`pm-badge ${!p.isAvailable || !p.stock ? 'muted' : ''}`}>{!p.isAvailable ? 'Yashirilgan' : !p.stock ? 'Tugagan' : 'Sotuvda'}</span></div><div className="pm-card-body"><small>{categories[p.category] || p.category}</small><h3>{p.name}</h3><p>{(p.discountPrice || p.price).toLocaleString()} so‘m {p.discountPrice ? <del>{p.price.toLocaleString()}</del> : null}</p><div className="pm-card-meta"><span>Qoldiq: <b>{p.stock} ta</b></span>{p.customizable && <span>Konstruktor ✓</span>}</div><div className="pm-card-actions"><button onClick={() => open(p)}>Tahrirlash</button><button disabled={stockBusy === p._id} onClick={() => toggle(p)}>{p.isAvailable ? 'Yashirish' : 'Sotuvga qaytarish'}</button></div></div></article>)}</div>{!visible.length && <div className="pm-empty">{products.length ? 'Qidiruvga mos mahsulot topilmadi.' : 'Birinchi mahsulotingizni qo‘shing.'}</div>}{products.length === 100 && <p className="pm-note">Oxirgi 100 ta mahsulot ko‘rsatilmoqda.</p>}</>}
    {modal && <div className="pm-backdrop" onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="pm-dialog" role="dialog" aria-modal="true" aria-labelledby="pm-title" ref={dialog}><header><div><small>SHAHNUR · ADMIN</small><h2 id="pm-title">{editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h2></div><button type="button" disabled={saving || preparing} onClick={close} aria-label="Yopish">×</button></header><form onSubmit={save}><fieldset disabled={saving || preparing} className="pm-fields">
      <section><h3>01 · Rasmlar</h3><ProductPhotos pictures={pictures} onChange={setPictures} onSelect={select} busy={preparing || saving} /><details className="pm-url"><summary>Rasm havolasi orqali qo‘shish</summary><div><input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" aria-label="Rasm havolasi" /><button type="button" onClick={() => { try { const u = new URL(url.trim()); if (u.protocol !== 'https:' || pictures.length >= 5) throw new Error(); setPictures([...pictures, { url: u.href }]); setUrl(''); setError(''); } catch { setError('HTTPS rasm havolasini kiriting. Jami 5 tagacha rasm mumkin.'); } }}>Qo‘shish</button></div></details></section>
      <section><h3>02 · Asosiy ma’lumotlar</h3><label>Mahsulot nomi *<input required maxLength={200} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Masalan: Qulupnayli tort" /></label><label>Tavsif *<textarea required maxLength={5000} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ta’mi, xususiyati va tayyorlash usuli haqida…" /></label><label>Kategoriya<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{Object.entries(categories).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label><div className="pm-row"><label>Narx (so‘m) *<input required type="number" inputMode="numeric" min={1} step={1} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></label><label>Qoldiq (dona) *<input required type="number" inputMode="numeric" min={0} step={1} value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></label></div><div className="pm-row"><label>Chegirmali narx<input type="number" inputMode="numeric" min={1} step={1} value={form.discountPrice} onChange={e => setForm({ ...form, discountPrice: e.target.value })} placeholder="Ixtiyoriy" /></label><label>Kam qoldiq chegarasi<input required type="number" inputMode="numeric" min={0} step={1} value={form.lowStockThreshold} onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })} /></label></div><div className="pm-row"><label>Vazni<input type="number" min={0} step="any" inputMode="decimal" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="Ixtiyoriy" /></label><label>O‘lchov birligi<select value={form.weightUnit} onChange={e => setForm({ ...form, weightUnit: e.target.value as typeof form.weightUnit })}><option value="kg">Kilogramm (kg)</option><option value="g">Gramm (g)</option><option value="lb">Funt (lb)</option><option value="oz">Unsiya (oz)</option></select></label></div><label className="pm-check"><input type="checkbox" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })} />Saytda sotuvga chiqarish</label></section>
      <section><h3>03 · Tarkib va tort konstruktori</h3><label>Tarkib<textarea maxLength={2000} value={form.ingredients} onChange={e => setForm({ ...form, ingredients: e.target.value })} placeholder="Masalan: un, sut, tuxum, shokolad…" /></label><div className="pm-allergens">{Object.entries(allergenNames).map(([id, names]) => <label className="pm-check" key={id}><input type="checkbox" checked={form.allergens.includes(id)} onChange={e => setForm({ ...form, allergens: e.target.checked ? [...form.allergens, id] : form.allergens.filter(a => a !== id) })} />{names[0]}</label>)}</div><label className="pm-check"><input type="checkbox" checked={form.ingredientsVerified} onChange={e => setForm({ ...form, ingredientsVerified: e.target.checked })} />Tarkib va allergenlar ma’lumotini tekshirdim</label><label className="pm-check"><input type="checkbox" checked={form.customizable} onChange={e => setForm({ ...form, customizable: e.target.checked })} />Tort konstruktorida tanlash mumkin</label>{form.customizable && <label>Konstruktor uchun 1 kg narxi (so‘m)<input required min={1} step={1} type="number" inputMode="numeric" value={form.customPricePerKg} onChange={e => setForm({ ...form, customPricePerKg: e.target.value })} /></label>}</section>
      <details className="pm-translations"><summary>Ruscha nom va tavsif qo‘shish</summary><label>Название<input maxLength={200} value={form.nameRu} onChange={e => setForm({ ...form, nameRu: e.target.value })} /></label><label>Описание<textarea maxLength={5000} value={form.descriptionRu} onChange={e => setForm({ ...form, descriptionRu: e.target.value })} /></label></details>
      <section className="pm-product-preview-section"><button type="button" className="pm-preview-toggle" aria-expanded={preview} onClick={() => setPreview(!preview)}>{preview ? 'Mahsulot ko‘rinishini yopish' : 'Saqlashdan oldin mahsulotni ko‘rish'}</button>{preview && <article className="pm-product-preview">
        {pictures[0] ? <img src={pictures[0].url} alt={form.name || 'Yangi mahsulot'} /> : <div className="pm-preview-placeholder">Mahsulot rasmini tanlang</div>}
        <div><small>{categories[form.category]}</small><h3>{form.name.trim() || 'Mahsulot nomi'}</h3><p>{form.description.trim() || 'Mahsulot tavsifi shu yerda ko‘rinadi.'}</p>
        <strong>{(Number(form.discountPrice) || Number(form.price) || 0).toLocaleString()} so‘m</strong>{Number(form.discountPrice) > 0 && Number(form.discountPrice) < Number(form.price) && <><del>{Number(form.price).toLocaleString()} so‘m</del><span className="pm-discount-label">−{Math.round((1 - Number(form.discountPrice) / Number(form.price)) * 100)}%</span></>}
        <p>{!form.isAvailable ? 'Saytda yashirilgan' : Number(form.stock) > 0 ? 'Sotuvda' : 'Qoldiq tugagan'} · {Number(form.stock) || 0} dona</p>{form.weight && <p>Vazni: {form.weight} {form.weightUnit}</p>}</div>
      </article>}</section>
    </fieldset>{preparing && <p role="status" className="pm-status">{progress}</p>}{error && <div className="pm-error" role="alert">{error}</div>}<footer><button type="button" disabled={saving || preparing} onClick={close}>Bekor qilish</button><button className="pm-primary" disabled={saving || preparing} type="submit">{saving ? progress : editing ? 'O‘zgarishlarni saqlash' : 'Mahsulotni qo‘shish'}</button></footer></form></div></div>}
  </div></AdminLayout>;
}
