# Shahnur Bakery

Yangi tort konstruktori, yetkazish vaqtlari, sovg‘a buyurtmalari, bonuslar, promokodlar, ikki tilli mijoz interfeysi va admin hisobotlari uchun [COMMERCE.md](COMMERCE.md)ni o‘qing.

React + TypeScript frontend va Express + MongoDB backend asosidagi qandolatchilik do‘koni.

## Talablar

- Node.js 20.19 yoki undan yangi versiya.
- MongoDB replica set yoki MongoDB Atlas. Buyurtma, ombor rezervlash va bekor qilish tranzaksiyada bajariladi; oddiy standalone MongoDB mos kelmaydi.
- Mahalliy MongoDB uchun Docker Desktop ixtiyoriy.

## Ishga tushirish

PowerShell orqali loyiha ildizida:

```powershell
npm.cmd --prefix shahnur-bakery-backend ci
npm.cmd --prefix shahnur-bakery-frontend ci
Copy-Item shahnur-bakery-backend/.env.example shahnur-bakery-backend/.env
Copy-Item shahnur-bakery-frontend/.env.example shahnur-bakery-frontend/.env
```

Mavjud `.env` fayllaringiz bo‘lsa, ularni ustidan yozmang: namunadagi kerakli maydonlarni mavjud sozlamalarga kiriting. Backend `.env` ichida `MONGODB_URI` va kuchli `JWT_SECRET`ni sozlang. Tasodifiy kalit olish:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Mahalliy replica set yaratish:

```powershell
docker compose up -d --wait
```

Compose MongoDB portini faqat mahalliy qurilmaga ochadi va ma’lumotlarni Docker volume ichida saqlaydi. Boshqa MongoDB allaqachon 27017 portda ishlayotgan bo‘lsa, Atlas URI yoki mavjud replica setdan foydalaning. Ushbu Compose sozlamasi mahalliy ishlab chiqish uchun.

Windowsda MongoDB 8.0 o‘rnatilgan bo‘lsa, Docker o‘rniga quyidagi buyruqdan foydalanish mumkin:

```powershell
npm.cmd run db:local
```

Bu buyruq MongoDBni 27018 portida, loyiha ichidagi `.local/mongodb` katalogida alohida replica set sifatida ishga tushiradi. Birinchi ishga tushirishda mavjud bazadan ma’lumotlarni yangi bazaga nusxalaydi va backend `.env`ini yangi manzilga o‘tkazadi. Asl baza o‘zgartirilmaydi; oldingi konfiguratsiya `.local/backend.env.before-replica`da saqlanadi. MongoDB qayta yuklashdan keyin ishlamasa, shu buyruqni qayta bajaring. `.local` katalogida mahalliy ma’lumot va maxfiy konfiguratsiya bor; uni tarqatmang.

Ikki terminalda:

```powershell
npm.cmd run dev:backend
```

```powershell
npm.cmd run dev:frontend
```

Frontend: `http://localhost:3000`. Backend: `http://localhost:5000`. Vite `/api` va `/socket.io` so‘rovlarini backendga yo‘naltiradi.

## Birinchi administrator

Backend `.env` ichida `ADMIN_EMAIL`, `ADMIN_PASSWORD` va `ADMIN_PHONE`ni kiriting. Administrator paroli 12–72 belgidan iborat bo‘lsin.

```powershell
npm.cmd run create-admin
```

Skript mavjud foydalanuvchini o‘chirmaydi yoki parolini almashtirmaydi. Tayyor standart admin paroli mavjud emas. Hisob yaratilgach, `.env` ichidan `ADMIN_PASSWORD`ni olib tashlash mumkin. Foydalanuvchi rollarini faqat superadmin o‘zgartiradi.

## Asosiy jarayonlar

1. Administrator telefondagi galereya yoki kameradan rasmlar tanlab mahsulot yaratadi: nomi, tavsifi, kategoriyasi, narxi, chegirmasi, vazni va ombor qoldig‘ini kiritadi. 5 tagacha rasm qo‘shish va asosiy rasmni tanlash mumkin.
2. Mijoz ro‘yxatdan o‘tadi, tizimga kiradi va savatchaga haqiqiy mahsulotlarni qo‘shadi.
3. Buyurtma narxini server hisoblaydi. Miqdor musbat butun son bo‘lishi kerak. Yetarli qoldiq bo‘lmasa yoki biror saqlash amali bajarilmasa, tranzaksiya bekor qilinadi.
4. Administrator buyurtmani ketma-ket `pending → confirmed → preparing → ready → out_for_delivery → delivered` holatlari orqali boshqaradi. Tayyor buyurtmani bevosita yetkazilgan deb belgilash ham mumkin.
5. Yetkazishdan oldin buyurtmani bekor qilish ombor qoldig‘ini bir marta tiklaydi. Bekor qilingan buyurtmani qayta faollashtirishga ruxsat yo‘q.
6. Faqat yetkazilgan mahsulotga xaridor sharh qoldiradi. Reyting tasdiqlangan sharhlardan hisoblanadi.
7. Yordam chatidagi xabarlar bazada saqlanadi va faqat ishtirokchilarga uzatiladi. Admin boshqa suhbatni ochganda unga ishtirokchi sifatida qo‘shiladi.
8. Aloqa formasi murojaatni bazaga saqlaydi. Admin `/admin/messages` sahifasida uni o‘qiydi.

Chatning oxirgi 100 xabari ko‘rsatiladi; bitta suhbat 10 000 xabar bilan chegaralangan. Katta hajmdagi qo‘llash uchun xabarlarni alohida kolleksiyaga o‘tkazish va tarix sahifalashini qo‘shish kerak.

## Tashqi xizmatlar

- **To‘lov:** naqd to‘lov ishlaydi. Payme va Click uchun to‘lov havolalari va tekshiriladigan callbacklar qo‘shilgan; haqiqiy savdogar rekvizitlari va `PAYMENTS_ENABLED=true` sozlanmaguncha ular ko‘rsatilmaydi. Ulanish tartibi va tekshiruv chegaralari [COMMERCE.md](COMMERCE.md)da. Uzum va Stripe ulanmagan.
- **Email:** SMTP sozlanganda parolni tiklash havolasi yuboriladi. Havola 30 daqiqa amal qiladi va bir marta ishlatiladi. SMTP sertifikati tekshiriladi. Sozlanmagan SMTP bilan tiklash emaili yetib bormaydi.
- **Telegram:** `TELEGRAM_BOT_TOKEN` va `TELEGRAM_ADMIN_CHAT_ID` sozlanganda yangi buyurtma xabari haqiqiy Bot API orqali yuboriladi.
- **Rasmlar:** admin panelidan galereya yoki kameradan yuklanadi. Telefon rasmlari brauzerda 1600 pikselgacha kichraytiriladi. Har bir fayl limiti 5 MB, mahsulotga 5 tagacha rasm. JPG, PNG, WEBP va GIF fayllari tarkibi tekshiriladi. Cloudinary sozlanmasa rasmlar MongoDB GridFS’da saqlanadi va `/api/media/:id` orqali ochiladi; Render diskining vaqtinchaligiga bog‘liq emas. Uchala Cloudinary rekviziti kiritilsa, yangi yuklamalar Cloudinary’da saqlanadi. Mavjud GridFS rasmlari ishlashda davom etadi. HTTPS rasm havolasini qo‘shish ham mumkin.
- **SMS va tashqi push:** provayder ulanmagan. Brauzer ichidagi bildirishnomalar Socket.IO orqali ishlaydi.

## Tekshiruv

```powershell
npm.cmd test
npm.cmd run test:integration
npm.cmd run build
```

Birlik testlari login API mosligi, parol xeshlash, buyurtma validatsiyasi, ombor rezervlash, takroriy bekor qilish, vakolatlar, chat va HTTP ruxsatlarini tekshiradi. Ular mavjud bazaga yozmaydi.

Integratsion test replica set talab qiladi. U tasodifiy `bakery_test_...` bazasini yaratib, haqiqiy login, parallel xarid, tranzaksiya rollbacki, takroriy checkout, bekor qilish, HTTP/Socket chat ruxsatlari, aloqa formasi va bir martalik parol tiklashni tekshiradi. Yakunda faqat shu test bazasi o‘chiriladi. Test email va Telegram yuborishni almashtiradi; haqiqiy xabar yubormaydi. SMTP/Cloudinary/provayderlar ishlashi haqiqiy rekvizitlar bilan alohida tekshiriladi.

## Ishlab chiqarish muhiti

- `NODE_ENV=production`, haqiqiy domen uchun `FRONTEND_URL`, maxfiy kalit va Atlas/replica set URI ni sozlang.
- Frontend `dist` katalogini HTTPS orqali tarqating. React marshrutlari uchun topilmagan yo‘llarni `index.html`ga qaytaring.
- Bir domen ishlatilsa, reverse proxy `/api` va `/socket.io`ni backendga yo‘naltirsin; Socket uchun WebSocket upgrade yoqilsin.
- Alohida API domenida frontend `VITE_API_URL=https://api.example.com/api` va `VITE_SOCKET_URL=https://api.example.com` bilan qayta yig‘ilsin.
- Backendni jarayon boshqaruvchisi bilan yuriting, MongoDB autentifikatsiyasi va zaxira nusxalarini sozlang. `.env`ni Gitga yubormang.

Oldingi versiyada parollar server loglariga yozilgan. Oldingi tizim haqiqiy foydalanuvchilar bilan ishlatilgan bo‘lsa, eski loglar kirishini cheklang va tegishli parollarni yangilang. Eski kod sabab buzilgan parol xeshlarini orqaga aylantirish mumkin emas; parolni tiklashdan foydalaniladi.
