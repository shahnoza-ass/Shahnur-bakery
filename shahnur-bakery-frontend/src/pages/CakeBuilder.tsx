import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineCheck, HiOutlineShoppingBag, HiOutlineRefresh, HiOutlineClock } from 'react-icons/hi';
import api from '../services/api';
import { Product, productService } from '../services/productService';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../context/LanguageContext';
import '../styles/cake-builder.css';

type Config = { weight: number; flavor: string; cream: string; decoration: string; inscription: string };
type Option = { id: string; name: string; extra: number };
type Options = { weights: number[]; flavors: Option[]; creams: Option[]; decorations: Option[] };
const initial: Config = { weight: 1, flavor: 'vanilla', cream: 'cream', decoration: 'simple', inscription: '' };
const money = (n: number) => n.toLocaleString('uz-UZ') + ' so‘m';
const photo = (p: Product) => p.images?.find(i => i.isMain)?.url || p.images?.[0]?.url || '';
const russian: Record<string, string> = { vanilla: 'Ваниль', chocolate: 'Шоколад', berry: 'Ягодный', cream: 'Сливочный', cheese: 'Крем-чиз', simple: 'Минимализм', flowers: 'Кремовые цветы', berries: 'Ягоды' };

export function CakeBuilder() {
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<Options | null>(null);
  const [productId, setProductId] = useState('');
  const [config, setConfig] = useState<Config>(initial);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState<{ key: string; price: number } | null>(null);
  const lock = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const [leadHours, setLeadHours] = useState(48);
  const quoteKey = JSON.stringify([productId, config]);
  const product = products.find(p => p._id === productId);
  const price = quote?.key === quoteKey ? quote.price : null;
  const name = (p: Product) => lang === 'ru' ? p.nameRu || p.name : p.name;
  const message = (e: any) => e.response?.data?.message || t('Ulanishda xatolik. Qayta urinib ko‘ring.', 'Ошибка соединения. Попробуйте снова.');
  useEffect(() => {
    let live = true; setLoading(true); setError('');
    Promise.all([api.get('/commerce/config'), productService.getProducts({ customizable: true, limit: 100 })]).then(([c, p]) => {
      if (!live) return;
      const o: Options = c.data.data.cakeOptions;
      if (!o?.weights?.length || !o.flavors?.length || !o.creams?.length || !o.decorations?.length) throw new Error('Invalid options');
      setOptions(o); setProducts(p.data); setProductId(p.data.find(p => p.isAvailable && p.stock > 0)?._id || p.data[0]?._id || '');
      setConfig({ weight: o.weights[0], flavor: o.flavors[0].id, cream: o.creams[0].id, decoration: o.decorations[0].id, inscription: '' });
      setLeadHours(c.data.data.customLeadHours || 48);
    }).catch(e => { if (live) setError(message(e)); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [revision]);
  useEffect(() => {
    if (!productId || !options) return;
    let live = true; setError('');
    const timer = setTimeout(() => {
      api.post('/commerce/cake-quote', { product: productId, customization: config }).then(r => {
        if (live) setQuote({ key: quoteKey, price: r.data.data.price });
      }).catch(e => { if (live) setError(message(e)); });
    }, 300);
    return () => { live = false; clearTimeout(timer); };
  }, [quoteKey, options]);
  const change = (patch: Partial<Config>) => { setConfig(c => ({ ...c, ...patch })); setError(''); };
  const go = (next: number) => { setStep(next); requestAnimationFrame(() => heading.current?.focus()); };
  const add = async () => {
    if (lock.current || !product || price === null || !product.isAvailable || product.stock < 1) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const r = await api.post('/commerce/cake-quote', { product: productId, customization: config });
      addToCart({ productId, name: product.name, image: photo(product), price: r.data.data.price, quantity: 1, customization: r.data.data.customization });
      toast.success(t('Tortingiz savatga qo‘shildi', 'Ваш торт добавлен в корзину')); navigate('/cart');
    } catch (e) { setError(message(e)); } finally { lock.current = false; setBusy(false); }
  };
  const steps = [t('Asos va vazn', 'Основа и вес'), t('Ta’m va krem', 'Вкус и крем'), t('Bezak va yozuv', 'Декор и надпись'), t('Yakuniy tanlov', 'Ваш выбор')];
  const selected = (list: Option[], id: string) => list.find(o => o.id === id);
  const label = (o?: Option) => o ? t(o.name, russian[o.id] || o.name) : '';
  const choices = (key: 'flavor' | 'cream' | 'decoration', list: Option[]) => <div className="atelier-options">{list.map(o => <button type="button" key={o.id} className={`atelier-option ${config[key] === o.id ? 'selected' : ''}`} aria-pressed={config[key] === o.id} onClick={() => change({ [key]: o.id })}><span className={`atelier-swatch swatch-${o.id}`} aria-hidden="true">{key === 'decoration' ? o.id === 'flowers' ? '✿' : o.id === 'berries' ? '●' : '♡' : ''}</span><span><b>{label(o)}</b><small>{o.extra ? `+${money(o.extra)}${key !== 'decoration' ? ' / kg' : ''}` : t('Narxga kiritilgan', 'Включено в стоимость')}</small></span><span className="atelier-check">{config[key] === o.id && <HiOutlineCheck />}</span></button>)}</div>;
  return <div className="commerce-page cake-atelier">
    <nav className="atelier-breadcrumb" aria-label={t('Sahifa yo‘li', 'Навигация')}><Link to="/">{t('Bosh sahifa', 'Главная')}</Link><span>/</span><span>{t('Tort konstruktori', 'Конструктор тортов')}</span></nav>
    <header className="atelier-intro"><div><p className="eyebrow">SHAHNUR · CAKE ATELIER</p><h1>{t('Sizning didingiz.', 'Ваш вкус.')}<br /><em>{t('Sizning tortingiz.', 'Ваш торт.')}</em></h1><p>{t('O‘z tortingizni yarating — har bir ta’m, har bir bezak va har bir so‘z sizdan.', 'Создайте свой торт — выберите вкус, декор и слова для особенного момента.')}</p></div><div className="atelier-promise"><HiOutlineClock /><span><b>{leadHours} {t('soat', 'часов')}</b><small>{t('Maxsus tort tayyorlash uchun', 'На приготовление особого торта')}</small></span></div></header>
    {loading ? <div className="atelier-loading" role="status"><span className="atelier-spinner" />{t('Tortingiz uchun imkoniyatlarni tayyorlayapmiz…', 'Готовим варианты для вашего торта…')}</div> : !options || !products.length ? <div className="atelier-empty"><h2>{t('Keling, birgalikda yaratamiz', 'Давайте создадим вместе')}</h2><p>{error || t('Hozircha konstruktor uchun tortlar mavjud emas. Individual buyurtma uchun bizga yozing.', 'Пока нет основ для конструктора. Напишите нам для индивидуального заказа.')}</p><Link className="bakery-button" to="/contact">{t('Bog‘lanish', 'Связаться')} <HiOutlineArrowRight /></Link>{error && <button className="atelier-text-button" onClick={() => setRevision(r => r + 1)}>{t('Qayta urinish', 'Повторить')}</button>}</div> : <>
      <nav className="atelier-steps" aria-label={t('Yaratish bosqichlari', 'Этапы создания')}>{steps.map((s, i) => <button key={s} onClick={() => go(i)} aria-current={step === i ? 'step' : undefined}><span>{i < step ? <HiOutlineCheck /> : `0${i + 1}`}</span><b>{s}</b></button>)}</nav>
      <div className="atelier-layout"><section className="atelier-editor" aria-busy={busy}><div className="atelier-section-heading"><div><p className="eyebrow">0{step + 1} / 04</p><h2 ref={heading} tabIndex={-1}>{steps[step]}</h2></div><button className="atelier-text-button" disabled={busy} onClick={() => { setConfig({ weight: options.weights[0], flavor: options.flavors[0].id, cream: options.creams[0].id, decoration: options.decorations[0].id, inscription: '' }); go(0); }}><HiOutlineRefresh />{t('Qaytadan', 'Сначала')}</button></div>
      <fieldset disabled={busy} className="atelier-fields">
        {step === 0 && <><p className="atelier-help">{t('Bayramingiz uchun asosni tanlang va mehmonlar soniga mos vaznni belgilang.', 'Выберите основу и вес по количеству гостей.')}</p><div className="atelier-products">{products.map(p => <button type="button" key={p._id} disabled={!p.isAvailable || p.stock < 1} aria-pressed={p._id === productId} className={`atelier-product ${p._id === productId ? 'selected' : ''}`} onClick={() => setProductId(p._id)}>{photo(p) ? <img src={photo(p)} alt="" /> : <span className="atelier-product-fallback" aria-hidden="true">♡</span>}<span><b>{name(p)}</b><small>{money(p.customPricePerKg || 0)} / kg</small>{(!p.isAvailable || p.stock < 1) && <small>{t('Hozircha tugagan', 'Нет в наличии')}</small>}</span><span className="atelier-check">{p._id === productId && <HiOutlineCheck />}</span></button>)}</div><h3>{t('Tort vazni', 'Вес торта')}</h3><div className="atelier-weights">{options.weights.map(w => <button type="button" key={w} aria-pressed={config.weight === w} onClick={() => change({ weight: w })}>{w} <small>kg</small></button>)}</div><p className="atelier-hint">≈ {Math.floor(config.weight * 6)}–{Math.floor(config.weight * 8)} {t('kishilik · bir porsiya taxminan 125–165 g', 'гостей · порция примерно 125–165 г')}</p></>}
        {step === 1 && <><p className="atelier-help">{t('Ichidan ham ajoyib. Sevimli ta’mingizni mayin krem bilan uyg‘unlashtiring.', 'Прекрасный и внутри. Сочетайте любимый вкус с нежным кремом.')}</p><h3>{t('Biskvit ta’mi', 'Вкус бисквита')}</h3>{choices('flavor', options.flavors)}<h3>{t('Krem', 'Крем')}</h3>{choices('cream', options.creams)}</>}
        {step === 2 && <><p className="atelier-help">{t('So‘nggi shtrixlar tortingizni alohida qiladi.', 'Последние штрихи сделают ваш торт особенным.')}</p><h3>{t('Bezak uslubi', 'Стиль декора')}</h3>{choices('decoration', options.decorations)}<label className="atelier-inscription">{t('Tort ustidagi yozuv', 'Надпись на торте')} <small>{t('Ixtiyoriy', 'Необязательно')}</small><textarea rows={2} maxLength={60} value={config.inscription} onChange={e => change({ inscription: e.target.value })} placeholder={t('Tug‘ilgan kuningiz bilan!', 'С днём рождения!')} aria-describedby="inscription-help" /></label><p id="inscription-help" className="atelier-counter">{t('Qisqa yozuv tort ustida chiroyliroq ko‘rinadi.', 'Короткая надпись лучше смотрится на торте.')} <span>{config.inscription.length}/60</span></p></>}
        {step === 3 && product && <><p className="atelier-help">{t('Hammasi siz istagandekmi? Tanlovlaringizni tekshiring va tortingizni savatga qo‘shing.', 'Всё как вы хотели? Проверьте выбор и добавьте торт в корзину.')}</p><dl className="atelier-review">{[[t('Asos', 'Основа'), name(product)], [t('Vazn', 'Вес'), `${config.weight} kg`], [t('Ta’m', 'Вкус'), label(selected(options.flavors, config.flavor))], [t('Krem', 'Крем'), label(selected(options.creams, config.cream))], [t('Bezak', 'Декор'), label(selected(options.decorations, config.decoration))], [t('Yozuv', 'Надпись'), config.inscription.trim() || t('Yozuvsiz', 'Без надписи')]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><details className="atelier-ingredients"><summary>{t('Asos tarkibi va allergenlar', 'Состав основы и аллергены')}</summary><p>{product.ingredients || t('Tarkib hali kiritilmagan.', 'Состав пока не указан.')}</p><p>{(product.allergens || []).map(a => t(({ milk: 'Sut', eggs: 'Tuxum', nuts: 'Yong‘oq', gluten: 'Gluten', soy: 'Soya', sesame: 'Kunjut' } as Record<string, string>)[a] || a, ({ milk: 'Молоко', eggs: 'Яйца', nuts: 'Орехи', gluten: 'Глютен', soy: 'Соя', sesame: 'Кунжут' } as Record<string, string>)[a] || a)).join(' · ')}</p><small>{t('Tanlangan krem va bezak tarkibini, allergenlar va kesishma kontaktni buyurtmadan oldin biz bilan aniqlashtiring.', 'Перед заказом уточните состав выбранного крема и декора, аллергены и перекрёстный контакт.')}</small></details></>}
      </fieldset>
      <div className="atelier-navigation"><button className="atelier-back" disabled={step === 0 || busy} onClick={() => go(step - 1)}><HiOutlineArrowLeft />{t('Orqaga', 'Назад')}</button>{step < 3 ? <button className="bakery-button" disabled={busy || !product?.stock || !product?.isAvailable} onClick={() => go(step + 1)}>{t('Davom etish', 'Продолжить')}<HiOutlineArrowRight /></button> : <span className="atelier-ready"><HiOutlineCheck />{t('Tanlovingiz tayyor', 'Ваш выбор готов')}</span>}</div></section>
      <aside className="atelier-summary"><div className="atelier-preview"><div className="atelier-preview-label"><span className="eyebrow">{t('SIZNING TORTINGIZ', 'ВАШ ТОРТ')}</span><span>{config.weight} kg</span></div><div className={`atelier-cake-stage cream-${config.cream}`}><div className={`drawn-cake ${config.flavor} ${config.decoration}`} aria-hidden="true"><div className="cake-top">{config.decoration === 'flowers' ? '✿ ✿ ✿' : config.decoration === 'berries' ? '● ● ●' : '♡'}<span>{config.inscription || 'Shahnur'}</span></div><div className="cake-layer" /><div className="cake-layer" /><div className="cake-plate" /></div></div><p>{t('Taxminiy eskiz. Yakuniy dizayn qandolatchi bilan kelishiladi.', 'Условный эскиз. Финальный дизайн согласовывается с кондитером.')}</p></div><div className="atelier-price"><h3>{product && name(product)}</h3><p>{label(selected(options.flavors, config.flavor))} · {label(selected(options.creams, config.cream))}</p><dl>{[[t('Asos', 'Основа'), (product?.customPricePerKg || 0) * config.weight], [t('Ta’m va krem', 'Вкус и крем'), ((selected(options.flavors, config.flavor)?.extra || 0) + (selected(options.creams, config.cream)?.extra || 0)) * config.weight], [t('Bezak', 'Декор'), selected(options.decorations, config.decoration)?.extra || 0]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{money(Number(v))}</dd></div>)}</dl><div className="atelier-total" aria-live="polite" aria-busy={price === null}><span>{t('Jami', 'Итого')}</span><strong>{price === null ? t('Hisoblanmoqda…', 'Расчёт…') : money(price)}</strong></div><small>{t('Yetkazib berish shartlari rasmiylashtirishda ko‘rsatiladi.', 'Условия доставки указаны при оформлении.')}</small>{error && <div className="commerce-error" role="alert">{error}<button className="atelier-text-button" onClick={() => { setQuote(null); setOptions({ ...options }); }}>{t('Qayta urinish', 'Повторить')}</button></div>}<button className="bakery-button atelier-add" disabled={step !== 3 || price === null || busy || !product?.stock || !product?.isAvailable} onClick={add}><HiOutlineShoppingBag />{busy ? t('Qo‘shilmoqda…', 'Добавляем…') : t('Savatga qo‘shish', 'Добавить в корзину')}<HiOutlineArrowRight /></button>{step < 3 && <p className="atelier-hint">{t('Savatga qo‘shish uchun 4 bosqichni yakunlang.', 'Завершите 4 этапа, чтобы добавить торт.')}</p>}<p className="atelier-delivery"><HiOutlineClock />{t(`Kamida ${leadHours} soat oldin buyurtma bering`, `Закажите минимум за ${leadHours} часов`)}</p></div></aside></div>
      <footer className="atelier-footer"><span>✧</span><div><h3>{t('Alohida g‘oyangiz bormi?', 'Есть особенная идея?')}</h3><p>{t('Murakkab dizayn yoki katta bayram uchun birgalikda yechim topamiz.', 'Подберём решение для сложного дизайна или большого праздника.')}</p></div><Link className="text-link" to="/contact">{t('Biz bilan bog‘laning', 'Связаться с нами')}<HiOutlineArrowRight /></Link></footer>
    </>}
  </div>;
}
