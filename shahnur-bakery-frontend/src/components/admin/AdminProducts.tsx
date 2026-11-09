import api from '../../services/api';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminLayout } from './AdminLayout';
import { productService, Product } from '../../services/productService';
import { allergenNames } from '../../pages/CommercePages';

const COLORS = {
  primary: '#D4883B',
  cream: '#FFFAF5',
  creamBorder: '#FFE1C0',
  dark: '#201A14',
  darkMuted: '#7A6A54',
  red: '#EF4444',
};

const EMPTY_FORM = {
  nameRu: '', descriptionRu: '', ingredients: '', allergens: [] as string[], ingredientsVerified: false, customizable: false, customPricePerKg: 150000, lowStockThreshold: 5,
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: 'tort',
  images: '',
};

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    try {
      const response = await api.get('/admin/products', { params: { limit: 100 } });
      const res = response.data;
      setProducts(res.data || []);
    } catch {
      toast.error("Mahsulotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nameRu: form.nameRu, descriptionRu: form.descriptionRu, ingredients: form.ingredients, allergens: form.allergens, ingredientsVerified: form.ingredientsVerified, customizable: form.customizable, customPricePerKg: Number(form.customPricePerKg), lowStockThreshold: Number(form.lowStockThreshold),
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category,
        images: form.images ? [{ url: form.images, isMain: true }] : [],
      };

      if (editing) {
        await productService.updateProduct(editing._id, payload as any);
        toast.success('Mahsulot yangilandi!');
      } else {
        await productService.createProduct(payload as any);
        toast.success("Mahsulot qo'shildi!");
      }
      setShowModal(false);
      loadProducts();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" o'chirilsinmi?`)) return;
    try {
      await productService.deleteProduct(id);
      toast.success("O'chirildi");
      loadProducts();
    } catch {
      toast.error('Xatolik');
    }
  };

  const handleStockChange = async (id: string, stock: number) => {
    try {
      await productService.updateStock(id, stock);
      toast.success('Ombor yangilandi');
    } catch {
      toast.error('Xatolik');
    }
  };

  return (
    <AdminLayout title="Mahsulotlar" subtitle="Mahsulotlarni boshqarish">
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <button
          onClick={() => {
            setEditing(null);
            setForm(EMPTY_FORM);
            setShowModal(true);
          }}
          className="px-5 py-2 rounded-lg font-semibold text-white"
          style={{ backgroundColor: COLORS.primary }}
        >
          + Yangi mahsulot
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p style={{ color: COLORS.darkMuted }}>Yuklanmoqda...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: COLORS.cream }}>
              <tr>
                <th className="text-left p-3 text-sm">Nomi</th>
                <th className="text-left p-3 text-sm">Narx</th>
                <th className="text-left p-3 text-sm">Ombor</th>
                <th className="text-right p-3 text-sm">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-3 font-semibold text-sm">{p.name}</td>
                  <td className="p-3 text-sm">{p.price.toLocaleString()} so'm</td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={p.stock}
                      onChange={(e) => handleStockChange(p._id, Number(e.target.value))}
                      className="w-20 px-2 py-1 rounded border-2 text-center text-sm outline-none"
                      style={{ borderColor: COLORS.creamBorder }}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setForm({
                          nameRu: p.nameRu || '', descriptionRu: p.descriptionRu || '', ingredients: p.ingredients || '', allergens: p.allergens || [], ingredientsVerified: p.ingredientsVerified || false, customizable: p.customizable || false, customPricePerKg: p.customPricePerKg || 150000, lowStockThreshold: p.lowStockThreshold ?? 5,
                          name: p.name,
                          description: p.description,
                          price: p.price,
                          stock: p.stock,
                          category: p.category,
                          images: p.images?.[0]?.url || '',
                        });
                        setShowModal(true);
                      }}
                      className="text-sm font-semibold mr-3"
                      style={{ color: COLORS.primary }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(p._id, p.name)}
                      className="text-sm font-semibold"
                      style={{ color: COLORS.red }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">
              {editing ? '✏️ Tahrirlash' : '+ Yangi mahsulot'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                required
                placeholder="Nomi"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 outline-none"
                style={{ borderColor: COLORS.creamBorder }}
              />
              <textarea
                required
                placeholder="Tavsif"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 outline-none"
                style={{ borderColor: COLORS.creamBorder }}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  placeholder="Narx"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="px-4 py-2 rounded-lg border-2 outline-none"
                  style={{ borderColor: COLORS.creamBorder }}
                />
                <input
                  required
                  type="number"
                  placeholder="Ombor"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="px-4 py-2 rounded-lg border-2 outline-none"
                  style={{ borderColor: COLORS.creamBorder }}
                />
              </div>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 outline-none"
                style={{ borderColor: COLORS.creamBorder }}
              >
                <option value="tort">🍰 Tort</option>
                <option value="kek">🧁 Kek</option>
                <option value="pirojniy">🍮 Pirojniy</option>
                <option value="cookie">🍪 Cookie</option>
                <option value="bread">🍞 Non</option>
              </select>
              <input
                placeholder="Rasm URL"
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 outline-none"
                style={{ borderColor: COLORS.creamBorder }}
              />
              <div className="builder-form commerce-admin-fields">
                <label>Ruscha nom / Название на русском<input value={form.nameRu} maxLength={200} onChange={e => setForm({ ...form, nameRu: e.target.value })} /></label>
                <label>Ruscha tavsif / Описание на русском<textarea value={form.descriptionRu} maxLength={5000} onChange={e => setForm({ ...form, descriptionRu: e.target.value })} /></label>
                <label>Tarkib / Состав<textarea value={form.ingredients} maxLength={2000} onChange={e => setForm({ ...form, ingredients: e.target.value })} /></label>
                <fieldset><legend>Allergenlar / Аллергены</legend>{Object.entries(allergenNames).map(([id, names]) => <label className="check-row" key={id}><input type="checkbox" checked={form.allergens.includes(id)} onChange={e => setForm({ ...form, allergens: e.target.checked ? [...form.allergens, id] : form.allergens.filter(a => a !== id) })} />{names.join(' / ')}</label>)}</fieldset>
                <label className="check-row"><input type="checkbox" checked={form.ingredientsVerified} onChange={e => setForm({ ...form, ingredientsVerified: e.target.checked })} />Tarkib tekshirildi / Состав проверен</label>
                <label className="check-row"><input type="checkbox" checked={form.customizable} onChange={e => setForm({ ...form, customizable: e.target.checked })} />Tort konstruktorida ko‘rsatish / Конструктор тортов</label>
                {form.customizable && <label>Asosiy narx / Базовая цена за kg<input type="number" min={1} step={1} required value={form.customPricePerKg} onChange={e => setForm({ ...form, customPricePerKg: Number(e.target.value) })} /></label>}
                <label>Kam qoldiq chegarasi / Порог остатка<input type="number" min={0} step={1} required value={form.lowStockThreshold} onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} /></label>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: COLORS.cream, color: COLORS.primary }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
