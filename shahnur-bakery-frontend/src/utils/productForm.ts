type ProductForm = {
  name: string; description: string; price: string; discountPrice: string;
  stock: string; weight: string; lowStockThreshold: string;
  customizable: boolean; customPricePerKg: string;
};

export function validateProductForm(form: ProductForm): string | null {
  if (!form.name.trim()) return 'Mahsulot nomini kiriting.';
  if (!form.description.trim()) return 'Mahsulot tavsifini kiriting.';
  const price = Number(form.price);
  if (!form.price.trim() || !Number.isSafeInteger(price) || price <= 0) return 'Narxni butun so‘mda, 0 dan katta kiriting.';
  if (form.discountPrice && (!Number.isSafeInteger(Number(form.discountPrice)) || Number(form.discountPrice) <= 0 || Number(form.discountPrice) >= price)) return 'Chegirmali narx asosiy narxdan kichik va 0 dan katta bo‘lsin.';
  for (const [value, label] of [[form.stock, 'Qoldiq'], [form.lowStockThreshold, 'Kam qoldiq chegarasi']]) {
    if (!value.trim() || !Number.isSafeInteger(Number(value)) || Number(value) < 0) return `${label} uchun 0 yoki musbat butun son kiriting.`;
  }
  if (form.weight && (!Number.isFinite(Number(form.weight)) || Number(form.weight) < 0)) return 'Vaznni 0 yoki musbat son bilan kiriting.';
  if (form.customizable && (!form.customPricePerKg.trim() || !Number.isSafeInteger(Number(form.customPricePerKg)) || Number(form.customPricePerKg) <= 0)) return 'Konstruktor uchun 1 kg narxini to‘g‘ri kiriting.';
  return null;
}
