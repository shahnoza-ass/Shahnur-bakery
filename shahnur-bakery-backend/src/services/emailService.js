const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Email transporter yaratish
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
};

// HTML email template
const emailTemplates = {
  verification: (firstName, token) => ({
    subject: 'Shahnur Bakery - Akkauntingizni tasdiqlang',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #fefaf5; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: white; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          .highlight { color: #8B4513; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎂 Shahnur Bakery</h1>
          </div>
          <div class="content">
            <h2>Assalomu alaykum, ${firstName}!</h2>
            <p>Shahnur Bakery'ga xush kelibsiz! Akkauntingizni tasdiqlash uchun quyidagi tugmani bosing:</p>
            <div style="text-align: center;">
              <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0]}/verify-email?token=${token}" class="button">
                Akkauntni tasdiqlash
              </a>
            </div>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.
            </p>
            <p style="margin-top: 10px; color: #999; font-size: 12px;">
              Bu havola 7 kun davomida amal qiladi.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Shahnur Bakery. Barcha huquqlar himoyalangan.</p>
            <p>Toshkent, O'zbekiston</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  welcome: (firstName) => ({
    subject: 'Shahnur Bakery - Xush kelibsiz!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #fefaf5; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: white; border-radius: 0 0 10px 10px; }
          .features { display: flex; justify-content: space-around; margin: 30px 0; }
          .feature { text-align: center; padding: 15px; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎂 Shahnur Bakery</h1>
          </div>
          <div class="content">
            <h2>Assalomu alaykum, ${firstName}! 🎉</h2>
            <p>Shahnur Bakery'ga ro'yxatdan o'tganingiz bilan tabriklaymiz!</p>
            
            <p>Endi siz:</p>
            <div class="features">
              <div class="feature">
                <div style="font-size: 30px;">🍰</div>
                <p>Eng sifatli tort va pirojniylarni ko'ring</p>
              </div>
              <div class="feature">
                <div style="font-size: 30px;">🚀</div>
                <p>Tez va qulay buyurtma bering</p>
              </div>
              <div class="feature">
                <div style="font-size: 30px;">⭐</div>
                <p>O'z sharhlaringizni qoldiring</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0]}/shop" style="display: inline-block; padding: 12px 30px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px;">
                Do'konga o'tish
              </a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Shahnur Bakery. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  orderConfirmation: (order, user) => ({
    subject: `Shahnur Bakery - Buyurtma #${order.orderNumber} qabul qilindi`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #fefaf5; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: white; border-radius: 0 0 10px 10px; }
          .order-details { background: #f8f4f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; text-align: right; padding: 15px 0; }
          .status { display: inline-block; padding: 5px 15px; background: #FFA500; color: white; border-radius: 20px; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎂 Shahnur Bakery</h1>
          </div>
          <div class="content">
            <h2>Buyurtma qabul qilindi! ✅</h2>
            <p>Hurmatli ${user.firstName}, buyurtmangiz qabul qilindi.</p>
            
            <div class="order-details">
              <p><strong>Buyurtma raqami:</strong> #${order.orderNumber}</p>
              <p><strong>Holati:</strong> <span class="status">${order.status}</span></p>
              <p><strong>Sana:</strong> ${new Date(order.createdAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p><strong>Yetkazib berish vaqti:</strong> ${order.deliveryTime}</p>
            </div>

            <h3>Buyurtma tarkibi:</h3>
            ${order.items.map(item => `
              <div class="order-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>${item.total.toLocaleString()} so'm</span>
              </div>
            `).join('')}
            
            <div class="total">
              <p>Jami: ${order.finalAmount.toLocaleString()} so'm</p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0]}/orders/${order._id}" style="display: inline-block; padding: 12px 30px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px;">
                Buyurtmani kuzatish
              </a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Shahnur Bakery. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  orderStatusUpdate: (order, user) => ({
    subject: `Shahnur Bakery - Buyurtma #${order.orderNumber} holati yangilandi`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #fefaf5; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: white; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 10px 25px; background: #4CAF50; color: white; border-radius: 5px; font-size: 18px; }
          .status-pending { background: #FFA500; }
          .status-delivered { background: #4CAF50; }
          .status-cancelled { background: #f44336; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎂 Shahnur Bakery</h1>
          </div>
          <div class="content">
            <h2>Buyurtma holati yangilandi! 🔄</h2>
            <p>Hurmatli ${user.firstName}, buyurtmangiz holati o'zgardi.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span class="status-badge ${order.status === 'delivered' ? 'status-delivered' : order.status === 'cancelled' ? 'status-cancelled' : 'status-pending'}">
                ${order.status === 'pending' ? '⏳ Kutilmoqda' : 
                  order.status === 'confirmed' ? '✅ Tasdiqlangan' :
                  order.status === 'preparing' ? '👨‍🍳 Tayyorlanmoqda' :
                  order.status === 'ready' ? '✅ Tayyor' :
                  order.status === 'out_for_delivery' ? '🚚 Yetkazilmoqda' :
                  order.status === 'delivered' ? '📦 Yetkazildi' :
                  order.status === 'cancelled' ? '❌ Bekor qilingan' : ''}
              </span>
            </div>

            <div style="background: #f8f4f0; padding: 15px; border-radius: 5px;">
              <p><strong>Buyurtma raqami:</strong> #${order.orderNumber}</p>
              <p><strong>Jami:</strong> ${order.finalAmount.toLocaleString()} so'm</p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0]}/orders/${order._id}" style="display: inline-block; padding: 12px 30px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px;">
                Batafsil ko'rish
              </a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Shahnur Bakery. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordReset: (firstName, token) => ({
    subject: 'Shahnur Bakery - Parolni tiklash',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #fefaf5; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: white; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎂 Shahnur Bakery</h1>
          </div>
          <div class="content">
            <h2>Parolni tiklash</h2>
            <p>Hurmatli ${firstName},</p>
            <p>Parolingizni tiklash uchun quyidagi tugmani bosing:</p>
            <div style="text-align: center;">
              <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0]}/reset-password/${token}" class="button">
                Parolni tiklash
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Agar siz parolni tiklashni so'ramagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Shahnur Bakery. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Email yuborish funksiyalari
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Shahnur Bakery" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email yuborishda xatolik:', error);
    return false;
  }
};

// Turli xil email turlari
const sendVerificationEmail = async (email, firstName, token) => {
  const template = emailTemplates.verification(firstName, token);
  return sendEmail(email, template.subject, template.html);
};

const sendWelcomeEmail = async (email, firstName) => {
  const template = emailTemplates.welcome(firstName);
  return sendEmail(email, template.subject, template.html);
};

const sendOrderConfirmation = async (order, user) => {
  const template = emailTemplates.orderConfirmation(order, user);
  return sendEmail(user.email, template.subject, template.html);
};

const sendOrderStatusUpdate = async (order, user) => {
  const template = emailTemplates.orderStatusUpdate(order, user);
  return sendEmail(user.email, template.subject, template.html);
};

const sendPasswordResetEmail = async (email, firstName, token) => {
  const template = emailTemplates.passwordReset(firstName, token);
  return sendEmail(email, template.subject, template.html);
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendPasswordResetEmail,
  sendEmail,
};
