const axios = require('axios');
require('dotenv').config();
class ChapaService {
  constructor() {
    this.baseURL = 'https://api.chapa.co/v1';
    this.secretKey = process.env.CHAPA_SECRET_KEY || 'your-chapa-secret-key';
  }

  async initializePayment(paymentData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Chapa initialize payment error:', error.response?.data || error.message);
      throw new Error('Failed to initialize payment');
    }
  }

  async verifyPayment(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Chapa verify payment error:', error.response?.data || error.message);
      throw new Error('Failed to verify payment');
    }
  }

  async getPaymentStatus(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Chapa get payment status error:', error.response?.data || error.message);
      throw new Error('Failed to get payment status');
    }
  }
}

module.exports = new ChapaService();