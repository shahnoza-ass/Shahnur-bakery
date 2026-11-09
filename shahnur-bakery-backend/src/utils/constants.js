// Mahsulot kategoriyalari
const PRODUCT_CATEGORIES = {
  TORT: 'tort',
  PIROJNIY: 'pirojniy',
  COOKIE: 'cookie',
  BREAD: 'bread',
  CAKE: 'cake',
  PASTRY: 'pastry',
  OTHER: 'other',
};

// Mahsulot kategoriyalari ro'yxati
const PRODUCT_CATEGORIES_LIST = Object.values(PRODUCT_CATEGORIES);

// Mahsulot kategoriyalari uchun label
const PRODUCT_CATEGORY_LABELS = {
  [PRODUCT_CATEGORIES.TORT]: 'Tort',
  [PRODUCT_CATEGORIES.PIROJNIY]: 'Pirojniy',
  [PRODUCT_CATEGORIES.COOKIE]: 'Cookie',
  [PRODUCT_CATEGORIES.BREAD]: 'Non',
  [PRODUCT_CATEGORIES.CAKE]: 'Kek',
  [PRODUCT_CATEGORIES.PASTRY]: 'Qandolat',
  [PRODUCT_CATEGORIES.OTHER]: 'Boshqa',
};

// Buyurtma statuslari
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Buyurtma statuslari ro'yxati
const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

// Buyurtma statuslari uchun label
const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Kutilmoqda',
  [ORDER_STATUS.CONFIRMED]: 'Tasdiqlangan',
  [ORDER_STATUS.PREPARING]: 'Tayyorlanmoqda',
  [ORDER_STATUS.READY]: 'Tayyor',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Yetkazilmoqda',
  [ORDER_STATUS.DELIVERED]: 'Yetkazilgan',
  [ORDER_STATUS.CANCELLED]: 'Bekor qilingan',
  [ORDER_STATUS.REFUNDED]: 'Qaytarilgan',
};

// To'lov usullari
const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  PAYME: 'payme',
  CLICK: 'click',
  UZUM: 'uzum',
};

// To'lov usullari ro'yxati
const PAYMENT_METHODS_LIST = Object.values(PAYMENT_METHODS);

// To'lov usullari uchun label
const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Naqd pul',
  [PAYMENT_METHODS.CARD]: 'Plastik karta',
  [PAYMENT_METHODS.PAYME]: 'Payme',
  [PAYMENT_METHODS.CLICK]: 'Click',
  [PAYMENT_METHODS.UZUM]: 'Uzum',
};

// To'lov statuslari
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Foydalanuvchi rollari
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superadmin',
};

// Foydalanuvchi statuslari
const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Maxfiylik sozlamalari
const PRIVACY_SETTINGS = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  MEMBERS_ONLY: 'members_only',
};

// Foydalanuvchi uchun maksimal buyurtma soni
const MAX_ORDERS_PER_DAY = 10;

// Mahsulot uchun maksimal rasm soni
const MAX_PRODUCT_IMAGES = 10;

// Rasm o'lchamlari
const IMAGE_SIZES = {
  THUMBNAIL: { width: 150, height: 150 },
  SMALL: { width: 300, height: 300 },
  MEDIUM: { width: 600, height: 600 },
  LARGE: { width: 1200, height: 1200 },
};

// Rasm formatlari
const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

// Maksimal fayl hajmi (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Session vaqti (7 kun)
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000;

// JWT expiratsiya vaqti
const JWT_EXPIRY = '7d';

// Parol tiklash tokeni expiratsiya vaqti (1 soat)
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000;

// Email tasdiqlash tokeni expiratsiya vaqti (7 kun)
const EMAIL_VERIFICATION_EXPIRY = 7 * 24 * 60 * 60 * 1000;

// Yetkazib berish zonasi (km)
const DELIVERY_ZONES = {
  TASHKENT: 10,
  REGIONS: 50,
};

// Yetkazib berish narxlari
const DELIVERY_PRICES = {
  BASE: 15000,
  PER_KM: 2000,
  FREE_DELIVERY_MIN_ORDER: 100000,
};

// Ish vaqtlari
const BUSINESS_HOURS = {
  OPEN: '09:00',
  CLOSE: '21:00',
  WEEKEND: ['Sunday'],
};

// Bayram kunlari
const HOLIDAYS = [
  '2024-01-01', // Yangi yil
  '2024-03-21', // Navro'z
  '2024-05-01', // Xalqaro mehnat kuni
  '2024-05-09', // Xotira va qadrlash kuni
  '2024-09-01', // Mustaqillik kuni
  '2024-10-01', // O'qituvchi va murabbiylar kuni
  '2024-12-08', // Konstitutsiya kuni
];

// Xabar turlari
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
};

// HTTP status kodlari
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Xato xabarlari
const ERROR_MESSAGES = {
  NOT_FOUND: 'Ma\'lumot topilmadi',
  UNAUTHORIZED: 'Ruxsat berilmagan',
  FORBIDDEN: 'Sizda bu amalni bajarish uchun ruxsat yo\'q',
  BAD_REQUEST: 'Noto\'g\'ri so\'rov',
  INTERNAL_SERVER_ERROR: 'Serverda xatolik yuz berdi',
  VALIDATION_ERROR: 'Validatsiya xatosi',
  DUPLICATE_ENTRY: 'Bu ma\'lumot allaqachon mavjud',
  INVALID_CREDENTIALS: 'Noto\'g\'ri email yoki parol',
  ACCOUNT_LOCKED: 'Akkaunt bloklangan',
  ACCOUNT_PENDING: 'Akkaunt hali tasdiqlanmagan',
  INSUFFICIENT_STOCK: 'Yetarli miqdorda mahsulot yo\'q',
};

// Muvaffaqiyatli xabarlar
const SUCCESS_MESSAGES = {
  CREATED: 'Muvaffaqiyatli yaratildi',
  UPDATED: 'Muvaffaqiyatli yangilandi',
  DELETED: 'Muvaffaqiyatli o\'chirildi',
  LOGIN_SUCCESS: 'Tizimga muvaffaqiyatli kirdingiz',
  REGISTER_SUCCESS: 'Ro\'yxatdan o\'tish muvaffaqiyatli',
  ORDER_CREATED: 'Buyurtma muvaffaqiyatli yaratildi',
  REVIEW_CREATED: 'Sharh muvaffaqiyatli qoldirildi',
};

module.exports = {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORIES_LIST,
  PRODUCT_CATEGORY_LABELS,
  ORDER_STATUS,
  ORDER_STATUS_LIST,
  ORDER_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHODS_LIST,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS,
  USER_ROLES,
  USER_STATUS,
  PRIVACY_SETTINGS,
  MAX_ORDERS_PER_DAY,
  MAX_PRODUCT_IMAGES,
  IMAGE_SIZES,
  ALLOWED_IMAGE_FORMATS,
  MAX_FILE_SIZE,
  SESSION_EXPIRY,
  JWT_EXPIRY,
  PASSWORD_RESET_EXPIRY,
  EMAIL_VERIFICATION_EXPIRY,
  DELIVERY_ZONES,
  DELIVERY_PRICES,
  BUSINESS_HOURS,
  HOLIDAYS,
  MESSAGE_TYPES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
