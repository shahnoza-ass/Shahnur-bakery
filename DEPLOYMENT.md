# Ommaviy sayt va PWA

## Tayyor imkoniyatlar

- Express production rejimida frontendni, `/api` va Socket.IO’ni bitta domenda ochadi.
- `/cake-builder`, `/checkout` kabi to‘g‘ridan-to‘g‘ri ochilgan sahifalar ishlaydi.
- HTTPS orqali PWA o‘rnatish taklifi, Android ikonkalari va iPhone uchun bosh ekranga qo‘shish ko‘rsatmasi mavjud.
- Internet uzilganda alohida sahifa chiqadi. Buyurtmalar, shaxsiy ma’lumotlar va API javoblari offline keshga yozilmaydi.
- Oddiy Wi-Fi HTTP manzilida PWA o‘rnatilishi kutilmaydi; ommaviy HTTPS manzil kerak.

## Render orqali joylash

1. Loyihani GitHub’dagi repozitoriyga yuboring. `.env`, `.local`, bazaning nusxalari va kalitlarni yubormang.
2. MongoDB Atlas’da loyiha va baza yarating. Baza foydalanuvchisini faqat shu ilova bazasiga ruxsat bilan yarating. Hosting chiqish IP manzillarini Atlas Network Access’ga kiriting.
3. Render’da New → Blueprint orqali repozitoriyni tanlang. `render.yaml` build, start va `/ready` sog‘lomlik tekshiruvini belgilaydi. Xizmat tarifini va to‘lovini ishga tushirishdan oldin tekshiring.
4. `MONGODB_URI` uchun Atlas ulanish satrini Render’ning maxfiy sozlamasiga kiriting. Kompyuterdagi `127.0.0.1:27018` ommaviy serverga mos emas.
5. `FRONTEND_URL`ni Render bergan aniq HTTPS sayt manziliga sozlang, masalan `https://<service>.onrender.com`. Oxirida `/` qo‘ymang. `JWT_SECRET` avtomatik yaratiladi. Kerak bo‘lsa deploy tugagach URLni to‘g‘rilab qayta deploy qiling.
6. Birinchi administrator uchun Render Environment ichida `ADMIN_EMAIL`, `ADMIN_PASSWORD` (kamida 12 belgi, ko‘pi bilan 72 UTF-8 bayt), `ADMIN_PHONE` (`+998XXXXXXXXX`)ni sozlab deploy qiling. Serverda superadmin bo‘lmasa va email band bo‘lmasa, tasdiqlangan superadmin avtomatik yaratiladi. `[admin] CREATED` logi chiqqach `ADMIN_PASSWORD`ni hosting sozlamasidan olib tashlang. Mavjud hisob admin qilinmaydi va mavjud admin paroli o‘zgarmaydi. Muqobil ravishda himoyalangan hosting terminalida `cd shahnur-bakery-backend && npm run create-admin` ishlatish mumkin. Parol va kalitlarni chatga, Git’ga yoki logga yozmang.
7. Mahalliy bazadagi mahsulotlar avtomatik ko‘chmaydi. Ularni tasdiqlangan zaxira nusxadan Atlas’ga ko‘chiring yoki admin paneldan kiriting. Haqiqiy mijoz ma’lumotlarini ko‘chirishni alohida rejalashtiring.
8. HTTPS manzilda katalog, ro‘yxatdan o‘tish, login, tort konstruktori, savat, buyurtma, admin va chatni tekshiring. `/ready` 200 javob qaytarishi kerak.

SMTP, Cloudinary va haqiqiy to‘lov xizmatlari uchun rekvizitlarni hostingdagi maxfiy sozlamalarda alohida kiriting. Sozlanmaguncha elektron to‘lov o‘chiq qoladi. Kalitlarni chatga yubormang.

## Docker varianti

Loyiha ildizidagi Dockerfile frontendni yig‘ib, ishlab chiqarish uchun Node serverga qo‘shadi. Baza konteynerga kiritilmagan: tashqi Atlas yoki replica set URI kerak.

```sh
docker build -t shahnur-bakery .
docker run --env-file /secure/path/production.env -p 5000:5000 shahnur-bakery
```

`production.env` ichida kamida `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` bo‘lsin. HTTPS reverse proxy orqasida bo‘lsa `TRUST_PROXY_HOPS`ni aynan ishonchli proxylar soniga sozlang. Noma’lum proxy zanjiriga `true` qo‘ymang.

## Telefon orqali o‘rnatish

- Android Chrome: HTTPS saytni oching va “O‘rnatish”ni bosing; tugma chiqmasa brauzer menyusidagi o‘rnatish amalidan foydalaning.
- iPhone Safari: Ulashish → Bosh ekranga qo‘shish.
- O‘rnatilgan ilova ham mahsulotlar va buyurtmalar uchun internet talab qiladi.

## Domen

Hostingdagi Custom Domain bo‘limida sotib olingan domenni qo‘shib, ko‘rsatilgan DNS yozuvlarini domen boshqaruvchisiga kiriting. HTTPS faol bo‘lgach `FRONTEND_URL`ni yangi domen bilan yangilang. Frontend API va chatni avtomatik shu domendan ishlatadi.

## Telegram — keyingi bosqich

Shu HTTPS manzil Telegram botidagi Mini App tugmasida ham ishlatilishi mumkin. BotFather sozlamalari va bot egasining amali kerak. Telegram hisobidan avtomatik login hali qo‘shilmagan; oddiy login saqlanadi. Bot tokenini frontendga joylashtirmang.

Rasmiy yo‘riqnomalar: https://render.com/docs/deploy-node-express-app va https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
