# Yangi savdo imkoniyatlari

## Mijoz uchun

- `/cake-builder`: haqiqiy, administrator konstruktor uchun yoqqan mahsulotdan tort yig‘ish. Vazn, ta’m, krem, bezak va 60 belgigacha yozuv. Eskiz shartli, narx serverda hisoblanadi. Maxsus tort kamida 48 soat oldin buyurtma qilinadi.
- `/favorites`: brauzerda saqlangan sevimlilar, mavjud mahsulotlarni ochish va savatga qo‘shish.
- `/shop`: sut, tuxum, yong‘oq, gluten, soya va kunjutni tarkibdan chiqarish filtrlari. Filtr faqat administrator tarkibini tekshirgan mahsulotlarni ko‘rsatadi; bu kesishma allergenlar yo‘qligiga kafolat emas.
- `/checkout`: sana, bo‘sh soat, sovg‘a oluvchi, telefon, tabrik, qadoq, promokod va bonuslar.
- `/my-orders`: tanlangan tort tafsilotlari, sovg‘a, to‘lov holati, to‘lovni davom ettirish va joriy narxlarda qayta xarid. Qayta xaridda mavjudlik yana tekshiriladi.
- `/loyalty`: balans va oxirgi 30 ta bonus bilan bog‘liq buyurtma.
- Menyudagi `RU` / `UZ`: mijozning asosiy sahifalari va yangi xarid jarayonlari. Tanlov brauzerda saqlanadi. Mahsulotning ruscha nomi/tavsifi administrator tomonidan kiritiladi; mavjud bo‘lmasa asl matn ko‘rsatiladi. Eski yordamchi/admin sahifalarining ayrim matnlari o‘zbekcha qolishi mumkin.

## Administrator uchun

`/admin/products` orqali:

1. Tarkib va allergenlarni kiriting, tekshirilgandan keyin tasdiqlash belgisini qo‘ying.
2. Mos tortda konstruktor belgisini yoqing va kg uchun asosiy narxni kiriting. Ombordagi bir birlik bitta tort buyurtmasini bildiradi, kilogrammni emas.
3. Ruscha nom va tavsifni kiriting.
4. Kam qoldiq ogohlantirish chegarasini belgilang.

`/admin/commerce` orqali:

- 93 kungacha davr uchun yetkazilgan va to‘langan buyurtmalarning kunlik tushumi;
- kam qolgan mahsulotlar va omborga havola;
- yetkazish sanasi/soati tartibidagi buyurtmalar kalendari (bir davrda 1000 tagacha yozuv; undan ko‘p bo‘lsa davrni qisqartiring);
- promokod yaratish, ishlatilgan limitni ko‘rish, yoqish va to‘xtatish.

Buyurtma tafsilotlarida tort parametrlari va sovg‘a oluvchining ma’lumotlari ko‘rinadi.

## Boshlang‘ich qoidalar

- Soatlar O‘zbekiston vaqti (`Asia/Tashkent`, UTC+5), 09:00–20:00. Oddiy buyurtma uchun kamida 2 soat, maxsus tort uchun 48 soat kerak. Sana kelgusi 90 kun ichida bo‘ladi.
- Har bir soatga dastlab 5 ta buyurtma. `.env`dagi `DELIVERY_SLOT_CAPACITY` bilan o‘zgartiriladi. Band qilish tranzaksiyada bajariladi; sahifadagi bo‘sh joy buyurtma tasdiqlanguncha kafolatlanmaydi. Eski buyurtmalar ham bandlik hisobiga kiritiladi.
- Oddiy qadoq bepul, lentali sovg‘a qadog‘i 15 000 so‘m. Yetkazish uchun alohida haq hozir hisoblanmaydi. Narx qoidalari `src/services/commercePolicy.js` va `orderWorkflow.js`da.
- Tort narxi: `(kg narxi + ta’m uchun kg ustamasi + krem uchun kg ustamasi) × vazn + bezak`. Hisob serverda bajariladi.
- Yetkazilgan buyurtmaning chegirmadan keyingi mahsulot summasidan 3% bonus beriladi. 1 bonus = 1 so‘m. Keyingi xaridning mahsulot summasidan 20% gacha qismi bonus bilan to‘lanadi. Qadoq uchun bonus ishlatilmaydi va hisoblanmaydi.
- Bitta buyurtmaga bitta promokod. 1–50% chegirma, minimal summa, tugash sanasi va umumiy foydalanish limiti bor. Bonus promokoddan keyingi summaga qo‘llanadi.
- Bekor qilishda ombor, vaqt, sarflangan bonus va promokod limiti bir marta tiklanadi. Yetkazilgan buyurtma qaytarilsa berilgan bonus yechiladi; oldin sarflangan bo‘lsa balans manfiy bo‘lishi mumkin.
- Band vaqtni admin to‘g‘ridan-to‘g‘ri almashtirmaydi: buyurtmani bekor qilib qayta yaratish kerak.

## Payme va Click

Kodda to‘lov havolalari va server callbacklari mavjud, lekin haqiqiy savdogar rekvizitlari avtomatik yaratilmaydi. Rekvizitlar bo‘lmasa faqat naqd to‘lov ko‘rsatiladi. Brauzerdan qaytish to‘lovni tasdiqlamaydi; faqat tekshirilgan provider callbacki `paid` holatini belgilaydi.

`.env.example`dagi maydonlarni haqiqiy `.env`da sozlang. Avval test muhitida sinovdan o‘tkazing, provayder tomonidan tasdiqlangach `PAYMENTS_ENABLED=true` qiling. Sirlarni frontendga yoki Gitga joylamang.

### Payme

- `PAYME_MERCHANT_ID`, `PAYME_SECRET_KEY`, `PAYME_TEST_MODE`.
- Callback: `https://API-DOMAIN/api/payments/payme`.
- Account maydoni: `order_id` — buyurtmaning MongoDB `_id` qiymati.
- Basic auth: `Paycom:<secret>`. Summalar tiyinlarda.
- CheckPerformTransaction, CreateTransaction, PerformTransaction, CancelTransaction, CheckTransaction, GetStatement qo‘llanadi. Tranzaksiyalar bazada saqlanadi; takroriy callbacklar takroran to‘lov yoki bonus yaratmaydi. Payme 12 soatlik timeouti transaction tekshiruvlarida qo‘llanadi.
- Yetkazilgan buyurtma uchun avtomatik qaytarish rad etiladi; bunday holat savdogar va provayder bilan alohida kelishiladi.

Rasmiy manbalar: [Payme Merchant API](https://developer.help.paycom.uz/metody-merchant-api/), [to‘lov havolasi](https://developer.help.paycom.uz/initsializatsiya-platezhey/otpravka-cheka-po-metodu-get/).

### Click

- `CLICK_MERCHANT_ID`, `CLICK_SERVICE_ID`, `CLICK_SECRET_KEY`.
- Prepare: `https://API-DOMAIN/api/payments/click/prepare`.
- Complete: `https://API-DOMAIN/api/payments/click/complete`.
- `merchant_trans_id` buyurtma `_id` qiymati. Imzo serverda tekshiriladi; summa buyurtmadagi haqiqiy narx bilan solishtiriladi. Takroriy Complete `Already paid` javobini qaytaradi. Click orqali refundni ushbu admin panel boshlamaydi; savdogar kabineti orqali alohida amalga oshiriladi.

Rasmiy manba: [Click hujjatlari](https://docs.click.uz/).

Public HTTPS callbacklar va merchant rekvizitlarisiz haqiqiy pul o‘tkazish tekshirilmagan. Mahalliy testlar provayder xabarlarini taqlid qiladi va haqiqiy to‘lov yubormaydi. Sertifikatsiya, fiskalizatsiya va provayderning savdogaringizga xos talablari ishlab chiqarishga chiqarishdan oldin bajariladi.

## Tekshiruv

```powershell
npm.cmd test
npm.cmd run test:integration
npm.cmd run build
```

Integratsion testlar alohida tasodifiy `bakery_test_...` bazalarini yaratib, faqat shu test bazalarini tozalaydi. Haqiqiy buyurtmalar yoki foydalanuvchilar o‘zgartirilmaydi.
