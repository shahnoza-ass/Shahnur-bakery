const User = require('../models/User');

// Credentials are supplied privately through hosting environment settings.
// Existing accounts are never promoted and existing passwords never change.
async function bootstrapAdmin(env = process.env, Users = User) {
  if (![env.ADMIN_EMAIL, env.ADMIN_PASSWORD, env.ADMIN_PHONE].some(Boolean)) return 'disabled';
  const email = String(env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;
  const phone = String(env.ADMIN_PHONE || '').replace(/\s/g, '');
  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) || typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72 || !/^\+998\d{9}$/.test(phone)) {
    console.log('[admin] SETUP_INCOMPLETE: Set ADMIN_EMAIL, a 12+ character ADMIN_PASSWORD (max 72 UTF-8 bytes), and ADMIN_PHONE in +998XXXXXXXXX format.');
    return 'invalid';
  }
  if (await Users.exists({ role: 'superadmin' })) {
    console.log('[admin] Superadmin already exists; credentials unchanged. Remove ADMIN_PASSWORD from hosting settings.');
    return 'exists';
  }
  if (await Users.exists({ email })) {
    console.log('[admin] EMAIL_EXISTS: The configured email belongs to an existing account. No permissions or passwords were changed. Choose an unused admin email.');
    return 'conflict';
  }
  try {
    await Users.create({ firstName: 'Admin', lastName: 'Bakery', email, password, phone, role: 'superadmin', status: 'approved', isActive: true, isVerified: true });
  } catch (error) {
    if (error.code === 11000 && await Users.exists({ role: 'superadmin' })) return 'exists';
    throw error;
  }
  console.log('[admin] CREATED: Superadmin created. Remove ADMIN_PASSWORD from hosting settings.');
  return 'created';
}

module.exports = { bootstrapAdmin };
