require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12 || password.length > 72) throw new Error('ADMIN_EMAIL va 12?72 belgilik ADMIN_PASSWORD kerak');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  if (await User.exists({ email: email.toLowerCase() })) throw new Error('Bu email mavjud. Mavjud hisob o?zgartirilmadi.');
  await User.create({ firstName: 'Admin', lastName: 'Bakery', email, password, phone: process.env.ADMIN_PHONE || '+998901234567', role: 'superadmin', status: 'approved', isActive: true, isVerified: true });
  console.log('Superadmin yaratildi. Parol logga chiqarilmadi.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
