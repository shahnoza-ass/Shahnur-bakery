function validateProduct(req, res, next) {
  const body = req.body || {};
  const reject = message => res.status(400).json({ success: false, message });
  for (const key of ['price', 'stock', 'weight', 'lowStockThreshold', 'customPricePerKg', 'discountPrice']) {
    if (body[key] === undefined || (key === 'discountPrice' && body[key] === null)) continue;
    if (typeof body[key] !== 'number' || !Number.isFinite(body[key]) || body[key] < 0 || (['stock', 'lowStockThreshold', 'price', 'discountPrice', 'customPricePerKg'].includes(key) && !Number.isSafeInteger(body[key]))) return reject('Narx va qoldiq ma’lumotlarini tekshiring.');
    if (['price', 'customPricePerKg', 'discountPrice'].includes(key) && body[key] === 0) return reject('Narx 0 dan katta bo‘lsin.');
  }
  if (body.discountPrice != null && body.price != null && body.discountPrice >= body.price) return reject('Chegirmali narx asosiy narxdan kichik bo‘lsin.');
  for (const [key, max] of [['name', 200], ['description', 5000], ['nameRu', 200], ['descriptionRu', 5000], ['ingredients', 2000]]) {
    if (body[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > max)) return reject('Matn maydonlarini tekshiring.');
  }
  for (const key of ['isAvailable', 'customizable', 'ingredientsVerified']) if (body[key] !== undefined && typeof body[key] !== 'boolean') return reject('Mahsulot sozlamalari noto‘g‘ri.');
  if (body.images !== undefined && (!Array.isArray(body.images) || body.images.length > 5 || body.images.some(image => {
    const url = typeof image === 'string' ? image : image?.url;
    return typeof url !== 'string' || url.length > 3000 || !(/^https:\/\//.test(url) || /^\/api\/media\/[a-f\d]{24}$/i.test(url));
  }))) return reject('5 tagacha HTTPS yoki yuklangan mahsulot rasmini kiriting.');
  next();
}
module.exports = validateProduct;
