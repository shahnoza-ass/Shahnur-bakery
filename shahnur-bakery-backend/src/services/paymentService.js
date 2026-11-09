class PaymentService {
  static async unavailable() { return { success: false, status: 'unavailable', error: 'Elektron to‘lov provayderi ulanmagan' }; }
  static processPaymePayment() { return this.unavailable(); }
  static processClickPayment() { return this.unavailable(); }
  static processUzumPayment() { return this.unavailable(); }
  static processStripePayment() { return this.unavailable(); }
  static verifyPayment() { return this.unavailable(); }
  static refundPayment() { return this.unavailable(); }
}
module.exports = PaymentService;
