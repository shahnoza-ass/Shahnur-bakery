const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const allergens = ['milk', 'eggs', 'nuts', 'gluten', 'soy', 'sesame'];
const cakeOptions = {
  flavors: [{ id: 'vanilla', name: 'Vanil', extra: 0 }, { id: 'chocolate', name: 'Shokolad', extra: 15000 }, { id: 'berry', name: 'Rezavor', extra: 20000 }],
  creams: [{ id: 'cream', name: 'Qaymoqli', extra: 0 }, { id: 'cheese', name: 'Chiz-krem', extra: 15000 }],
  decorations: [{ id: 'simple', name: 'Minimal', extra: 0 }, { id: 'flowers', name: 'Krem gullari', extra: 30000 }, { id: 'berries', name: 'Rezavorlar', extra: 45000 }],
  weights: [1, 1.5, 2, 2.5, 3, 4, 5],
};
function customization(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || !cakeOptions.weights.includes(value.weight)) throw fail('Tort vazni noto‘g‘ri');
  const result = { weight: value.weight };
  for (const [key, list] of [['flavor', cakeOptions.flavors], ['cream', cakeOptions.creams], ['decoration', cakeOptions.decorations]]) {
    if (!list.some(option => option.id === value[key])) throw fail('Tort tanlovi noto‘g‘ri');
    result[key] = value[key];
  }
  if (value.inscription !== undefined && (typeof value.inscription !== 'string' || value.inscription.length > 60)) throw fail('Tort yozuvi 60 belgidan oshmasin');
  result.inscription = (value.inscription || '').trim();
  return result;
}
function cakePrice(product, config) {
  if (!config) return product.price;
  if (!product.customizable || !Number.isSafeInteger(product.customPricePerKg) || product.customPricePerKg < 1) throw fail('Bu mahsulot uchun konstruktor yoqilmagan', 409);
  return Math.round((product.customPricePerKg + cakeOptions.flavors.find(o => o.id === config.flavor).extra + cakeOptions.creams.find(o => o.id === config.cream).extra) * config.weight + cakeOptions.decorations.find(o => o.id === config.decoration).extra);
}
function dateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) throw fail('Sana noto‘g‘ri');
  const key = value.slice(0, 10);
  const date = new Date(key + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== key) throw fail('Sana noto‘g‘ri');
  return key;
}
function slotsFor(value, now = Date.now()) {
  const day = dateKey(value);
  if (new Date(day).getTime() > now + 90 * 86400000) throw fail('Sana 90 kun ichida bo‘lsin');
  const hours = Array.from({ length: 12 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`);
  return hours.filter(time => new Date(`${day}T${time}:00+05:00`).getTime() >= now + 2 * 3600000);
}
function gift(value) {
  if (value !== undefined && value !== null && (typeof value !== 'object' || typeof value.enabled !== 'boolean')) throw fail('Sovg‘a sozlamasi noto‘g‘ri');
  if (!value?.enabled) return undefined;
  if (typeof value.recipient !== 'string' || !value.recipient.trim() || value.recipient.length > 100 || !/^\+998\d{9}$/.test(value.phone || '') || typeof value.message !== 'string' || value.message.length > 300 || !['standard', 'ribbon'].includes(value.packaging)) throw fail('Sovg‘a oluvchi, telefon, tabrik va qadoqni tekshiring');
  return { enabled: true, recipient: value.recipient.trim(), phone: value.phone, message: value.message.trim(), packaging: value.packaging };
}
module.exports = { fail, allergens, cakeOptions, customization, cakePrice, dateKey, slotsFor, gift };
