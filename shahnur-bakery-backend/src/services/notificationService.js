class NotificationService {
  static async sendSMS() { return { success: false, status: 'unavailable', error: 'SMS provayderi ulanmagan' }; }
  static async sendPushNotification() { return { success: false, status: 'unavailable', error: 'Push provayderi ulanmagan' }; }
  static async sendTelegramMessage(chatId, message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !chatId) return { success: false, status: 'unavailable' };
    try {
      const response = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }), signal: AbortSignal.timeout(8000),
      });
      const result = await response.json();
      return { success: response.ok && result.ok === true, status: result.ok ? 'sent' : 'failed' };
    } catch { return { success: false, status: 'failed' }; }
  }
  static async notifyNewOrder(order, user = order.user) {
    return this.sendTelegramMessage(process.env.TELEGRAM_ADMIN_CHAT_ID,
      'Yangi buyurtma: ' + order.orderNumber + '\nMijoz: ' + (user?.firstName || '') + ' ' + (user?.lastName || '') + '\nJami: ' + order.finalAmount + " so'm");
  }
  static async notifyOrderStatus(order) {
    return this.sendTelegramMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, 'Buyurtma: ' + order.orderNumber + '\nHolat: ' + order.status);
  }
  static async notifyNewUser() { return { success: false, status: 'unavailable' }; }
  static async sendDailyStats(stats) { return this.sendTelegramMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, JSON.stringify(stats)); }
}
module.exports = NotificationService;
